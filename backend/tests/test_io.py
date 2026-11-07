"""Testy endpointów importu i eksportu na repozytoriach w pamięci; każdy test ma świeżą aplikację."""

import json
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from src.config import MAX_IMPORT_FILE_BYTES, Settings
from src.main import create_app
from src.schemas.scene import Scene

FRONTEND = "http://localhost:5173"


@pytest.fixture
def client(assets_manifest) -> TestClient:
    return TestClient(create_app(Settings(client_origins=[FRONTEND], assets_manifest=assets_manifest)))


def add_project(client: TestClient, scene_data: dict, **changes) -> None:
    """Zapisuje scenę wprost w repozytorium aplikacji, z pominięciem endpointów."""
    scene = Scene.model_validate({**scene_data, **changes})
    client.app.state.project_repository.save_project(scene)


def import_file(client: TestClient, content: bytes):
    """Wysyła plik do POST /api/projects/import tak jak formularz przeglądarki (multipart, pole "file")."""
    return client.post("/api/projects/import", files={"file": ("mapa.worldsmith.json", content, "application/json")})


def without_server_fields(scene: dict) -> dict:
    """Zwraca scenę bez pól nadawanych przez serwer (id i daty)."""
    return {key: value for key, value in scene.items() if key not in ("id", "createdAt", "updatedAt")}


def test_export_returns_scene_as_file(client, scene_data):
    add_project(client, scene_data, id="p1", name="Zielona dolina")

    response = client.get("/api/projects/p1/export")

    assert response.status_code == 200
    assert response.headers["content-disposition"] == 'attachment; filename="Zielona-dolina.worldsmith.json"'
    assert response.json() == {**scene_data, "id": "p1", "name": "Zielona dolina"}


def test_export_unknown_project_returns_404(client):
    response = client.get("/api/projects/missing/export")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "PROJECT_NOT_FOUND"


def test_export_header_is_visible_to_frontend(client, scene_data):
    add_project(client, scene_data, id="p1")

    response = client.get("/api/projects/p1/export", headers={"Origin": FRONTEND})

    assert response.headers["access-control-expose-headers"] == "Content-Disposition"


def test_import_creates_new_project(client, scene_data):
    response = import_file(client, json.dumps(scene_data).encode("utf-8"))

    assert response.status_code == 201
    saved = response.json()
    # Serwer nadaje nowe id (UUID) i daty, reszta sceny zostaje z pliku.
    assert saved["id"] != scene_data["id"]
    UUID(saved["id"])
    assert saved["createdAt"] == saved["updatedAt"]
    assert without_server_fields(saved) == without_server_fields(scene_data)
    assert client.get(f"/api/projects/{saved['id']}").json() == saved


def test_export_then_import_gives_same_scene_with_new_id(client, scene_data):
    add_project(client, scene_data, id="p1")
    exported = client.get("/api/projects/p1/export")

    imported = import_file(client, exported.content).json()

    assert imported["id"] != "p1"
    assert without_server_fields(imported) == without_server_fields(exported.json())


def test_import_file_that_is_not_json_returns_400(client):
    response = import_file(client, b"to nie jest JSON")

    assert response.status_code == 400
    assert response.json() == {"error": {"code": "INVALID_FILE", "messageKey": "errors.invalidFile", "details": {}}}


def test_import_file_with_wrong_shape_returns_400_with_fields(client, scene_data):
    del scene_data["name"]

    response = import_file(client, json.dumps(scene_data).encode("utf-8"))

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_FILE"
    assert response.json()["error"]["details"]["issues"] == [
        {"code": "INVALID_FIELD", "messageKey": "errors.invalidField", "field": "name"}
    ]


def test_import_file_over_size_limit_returns_413(client):
    # Plik powyżej 2 MB, ale całe zapytanie poniżej 3 MB, więc odrzuca go dopiero sprawdzenie pliku.
    response = import_file(client, b" " * (MAX_IMPORT_FILE_BYTES + 1))

    assert response.status_code == 413
    assert response.json()["error"]["code"] == "INVALID_FILE"


def test_import_scene_breaking_rules_returns_422(client, scene_data):
    scene_data["layers"][0]["objects"][0]["scaleX"] = 100

    response = import_file(client, json.dumps(scene_data).encode("utf-8"))

    assert response.status_code == 422
    assert response.json()["error"]["details"]["issues"] == [
        {"code": "SCALE_OUT_OF_RANGE", "messageKey": "errors.scaleOutOfRange", "layerId": "l1", "objectId": "o1"}
    ]
    assert client.get("/api/projects").json() == []


def test_import_without_file_field_returns_422(client):
    response = client.post("/api/projects/import", data={"other": "x"})

    assert response.status_code == 422
    assert response.json()["error"]["details"]["issues"] == [
        {"code": "INVALID_FIELD", "messageKey": "errors.invalidField", "field": "file"}
    ]
