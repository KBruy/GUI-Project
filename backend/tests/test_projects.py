"""Testy endpointów /api/projects na repozytoriach w pamięci; każdy test ma świeżą aplikację."""

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
