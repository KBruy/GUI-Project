"""Testy endpointów /api/projects na repozytoriach w pamięci; każdy test ma świeżą aplikację."""

from datetime import datetime
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from src.config import Settings
from src.main import create_app
from src.schemas.scene import Scene


@pytest.fixture
def client(assets_manifest) -> TestClient:
    return TestClient(create_app(Settings(client_origins=["http://localhost:5173"], assets_manifest=assets_manifest)))


def add_project(client: TestClient, scene_data: dict, **changes) -> None:
    """Zapisuje scenę wprost w repozytorium aplikacji, z pominięciem endpointów."""
    scene = Scene.model_validate({**scene_data, **changes})
    client.app.state.project_repository.save_project(scene)


def post_project(client: TestClient, scene_data: dict) -> dict:
    """Tworzy projekt przez POST i zwraca zapisaną scenę z odpowiedzi."""
    response = client.post("/api/projects", json=scene_data)
    assert response.status_code == 201
    return response.json()


def without_server_fields(scene: dict) -> dict:
    """Zwraca scenę bez pól nadawanych przez serwer (id i daty)."""
    return {key: value for key, value in scene.items() if key not in ("id", "createdAt", "updatedAt")}


def test_list_projects_is_empty_at_start(client):
    response = client.get("/api/projects")

    assert response.status_code == 200
    assert response.json() == []


def test_list_projects_returns_summaries_without_scene(client, scene_data):
    add_project(client, scene_data, id="p1")

    assert client.get("/api/projects").json() == [
        {
            "id": "p1",
            "type": "map",
            "name": "Wioska",
            "createdAt": "2026-10-26T12:00:00Z",
            "updatedAt": "2026-10-26T12:00:00Z",
        }
    ]


def test_list_projects_sorts_by_updated_at_newest_first(client, scene_data):
    add_project(client, scene_data, id="old", updatedAt="2026-10-01T10:00:00Z")
    add_project(client, scene_data, id="new", updatedAt="2026-10-02T10:00:00Z")

    assert [project["id"] for project in client.get("/api/projects").json()] == ["new", "old"]


def test_list_projects_filters_by_type(client, scene_data):
    add_project(client, scene_data, id="map1")
    add_project(client, scene_data, id="hero", type="character")

    response = client.get("/api/projects", params={"type": "character"})

    assert [project["id"] for project in response.json()] == ["hero"]


def test_list_projects_with_unknown_type_returns_validation_error(client):
    response = client.get("/api/projects", params={"type": "space"})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_FAILED"
    assert response.json()["error"]["details"]["issues"][0]["field"] == "type"


def test_get_project_returns_full_scene(client, scene_data):
    add_project(client, scene_data)

    response = client.get(f"/api/projects/{scene_data['id']}")

    assert response.status_code == 200
    assert response.json() == scene_data


def test_get_unknown_project_returns_project_not_found(client):
    response = client.get("/api/projects/missing")

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "PROJECT_NOT_FOUND", "messageKey": "errors.projectNotFound", "details": {}}
    }


def test_delete_project_returns_204_and_removes_it(client, scene_data):
    add_project(client, scene_data)

    response = client.delete(f"/api/projects/{scene_data['id']}")

    assert response.status_code == 204
    assert response.content == b""
    assert client.get(f"/api/projects/{scene_data['id']}").status_code == 404


def test_delete_unknown_project_returns_project_not_found(client):
    response = client.delete("/api/projects/missing")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "PROJECT_NOT_FOUND"


def test_create_project_returns_201_with_new_id_and_dates(client, scene_data):
    response = client.post("/api/projects", json=scene_data)

    assert response.status_code == 201
    saved = response.json()
    assert saved["id"] != scene_data["id"]
    assert str(UUID(saved["id"])) == saved["id"]
    assert saved["createdAt"] == saved["updatedAt"]
    assert without_server_fields(saved) == without_server_fields(scene_data)


def test_created_project_can_be_read_and_listed(client, scene_data):
    saved = post_project(client, scene_data)

    assert client.get(f"/api/projects/{saved['id']}").json() == saved
    assert [project["id"] for project in client.get("/api/projects").json()] == [saved["id"]]


def test_create_project_rejects_scene_breaking_rules(client, scene_data):
    scene_data["layers"][0]["objects"][0]["scaleX"] = 20

    response = client.post("/api/projects", json=scene_data)

    assert response.status_code == 422
    assert response.json()["error"]["details"]["issues"] == [
        {"code": "SCALE_OUT_OF_RANGE", "messageKey": "errors.scaleOutOfRange", "layerId": "l1", "objectId": "o1"}
    ]
    assert client.get("/api/projects").json() == []


def test_create_project_rejects_scene_with_missing_field(client, scene_data):
    del scene_data["name"]

    response = client.post("/api/projects", json=scene_data)

    assert response.status_code == 422
    assert response.json()["error"]["details"]["issues"][0]["field"] == "name"


def test_update_project_saves_scene_with_id_from_url_and_new_updated_at(client, scene_data):
    saved = post_project(client, scene_data)
    scene_data["name"] = "Miasto"

    response = client.put(f"/api/projects/{saved['id']}", json=scene_data)

    assert response.status_code == 200
    updated = response.json()
    assert updated["id"] == saved["id"]
    assert updated["name"] == "Miasto"
    assert updated["createdAt"] == saved["createdAt"]
    assert datetime.fromisoformat(updated["updatedAt"]) >= datetime.fromisoformat(saved["updatedAt"])
    assert client.get(f"/api/projects/{saved['id']}").json() == updated


def test_updated_project_moves_to_top_of_list(client, scene_data):
    first = post_project(client, scene_data)
    second = post_project(client, scene_data)

    client.put(f"/api/projects/{first['id']}", json=scene_data)

    assert [project["id"] for project in client.get("/api/projects").json()] == [first["id"], second["id"]]


def test_update_unknown_project_returns_project_not_found(client, scene_data):
    response = client.put("/api/projects/missing", json=scene_data)

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "PROJECT_NOT_FOUND"


def test_update_project_rejects_type_change(client, scene_data):
    saved = post_project(client, scene_data)
    scene_data["type"] = "character"

    response = client.put(f"/api/projects/{saved['id']}", json=scene_data)

    assert response.status_code == 422
    assert response.json()["error"]["details"]["issues"] == [
        {"code": "INVALID_FIELD", "messageKey": "errors.invalidField", "field": "type"}
    ]


def test_update_project_rejects_scene_breaking_rules(client, scene_data):
    saved = post_project(client, scene_data)
    scene_data["name"] = ""

    response = client.put(f"/api/projects/{saved['id']}", json=scene_data)

    assert response.status_code == 422
    assert [issue["code"] for issue in response.json()["error"]["details"]["issues"]] == ["NAME_REQUIRED"]
    assert client.get(f"/api/projects/{saved['id']}").json() == saved
