"""Testy endpointu GET /api/assets na manifeście testowym."""

import pytest
from fastapi.testclient import TestClient

from src.config import Settings
from src.main import create_app


@pytest.fixture
def client(assets_manifest) -> TestClient:
    settings = Settings(client_origins=["http://localhost:5173"], assets_manifest=assets_manifest)
    return TestClient(create_app(settings))


def ids(response) -> list[str]:
    return [asset["id"] for asset in response.json()]


def test_list_assets_returns_all_assets_with_all_fields(client):
    response = client.get("/api/assets")

    assert response.status_code == 200
    assert ids(response) == ["map_tree_oak_01", "map_rock_01", "character_hair_short_01"]
    assert response.json()[0] == {
        "id": "map_tree_oak_01",
        "module": "map",
        "category": "trees",
        "nameKey": "assets.map.tree_oak",
        "file": "map/trees/map_tree_oak_01.png",
        "width": 64,
        "height": 96,
    }


def test_list_assets_filters_by_module(client):
    response = client.get("/api/assets", params={"module": "character"})

    assert ids(response) == ["character_hair_short_01"]


def test_list_assets_filters_by_module_and_category(client):
    response = client.get("/api/assets", params={"module": "map", "category": "trees"})

    assert ids(response) == ["map_tree_oak_01"]


def test_list_assets_with_unknown_category_returns_empty_list(client):
    response = client.get("/api/assets", params={"category": "dragons"})

    assert response.status_code == 200
    assert response.json() == []


def test_list_assets_rejects_unknown_module(client):
    response = client.get("/api/assets", params={"module": "space"})

    assert response.status_code == 422
    assert response.json() == {
        "error": {
            "code": "VALIDATION_FAILED",
            "messageKey": "errors.validationFailed",
            "details": {"issues": [{"code": "INVALID_FIELD", "messageKey": "errors.invalidField", "field": "module"}]},
        }
    }
