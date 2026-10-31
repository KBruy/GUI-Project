"""Testy endpointu GET /api/assets na manifeście testowym i serwowania plików PNG z /static/assets."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.config import Settings
from src.main import create_app


# Udaje plik PNG: serwer plików nie sprawdza zawartości, liczy się tylko rozszerzenie.
FAKE_PNG = b"\x89PNG fake-image-data"


@pytest.fixture
def storage_dir(tmp_path) -> Path:
    return tmp_path / "storage"


@pytest.fixture
def client(assets_manifest, storage_dir) -> TestClient:
    settings = Settings(
        client_origins=["http://localhost:5173"],
        assets_manifest=assets_manifest,
        storage_dir=storage_dir,
    )
    return TestClient(create_app(settings))


def put_png(storage_dir: Path, file: str) -> None:
    """Zapisuje FAKE_PNG w storage/assets pod ścieżką z pola file assetu."""
    path = storage_dir / "assets" / file
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(FAKE_PNG)


def ids(response) -> list[str]:
    return [asset["id"] for asset in response.json()]


def test_list_assets_returns_all_assets_with_all_fields(client):
    response = client.get("/api/assets")

    assert response.status_code == 200
    assert ids(response) == ["map_tree_oak_01", "map_rock_01", "char_hair_short_01"]
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

    assert ids(response) == ["char_hair_short_01"]


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


def test_app_creates_empty_assets_folder_on_start(client, storage_dir):
    assert (storage_dir / "assets").is_dir()


def test_png_is_served_under_asset_file_path(client, storage_dir):
    put_png(storage_dir, "map/trees/map_tree_oak_01.png")

    response = client.get("/static/assets/map/trees/map_tree_oak_01.png")

    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content == FAKE_PNG


def test_png_response_allows_frontend_origin(client, storage_dir):
    # Nagłówek CORS pozwala frontendowi czytać piksele obrazka narysowanego na canvasie.
    put_png(storage_dir, "map/rocks/map_rock_01.png")

    response = client.get("/static/assets/map/rocks/map_rock_01.png", headers={"Origin": "http://localhost:5173"})

    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_missing_png_returns_not_found_in_error_format(client):
    response = client.get("/static/assets/map/trees/missing.png")

    assert response.status_code == 404
    assert response.json() == {"error": {"code": "NOT_FOUND", "messageKey": "errors.notFound", "details": {}}}
