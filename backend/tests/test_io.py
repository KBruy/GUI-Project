"""Testy endpointów importu i eksportu na repozytoriach w pamięci; każdy test ma świeżą aplikację."""

import pytest
from fastapi.testclient import TestClient

from src.config import Settings
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
