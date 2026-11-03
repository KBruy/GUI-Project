"""Testy endpointu GET /api/assets na manifeście testowym i serwowania plików PNG z /static/assets."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.config import Settings
from src.main import create_app


# Udaje plik PNG: serwer plików nie sprawdza zawartości, liczy się tylko rozszerzenie.
FAKE_PNG = b"\x89PNG fake-image-data"


def make_client(manifest: Path) -> TestClient:
    return TestClient(create_app(Settings(client_origins=["http://localhost:5173"], assets_manifest=manifest)))


@pytest.fixture
def assets_dir(tmp_path, assets_manifest) -> Path:
    """Zwraca tymczasowy folder assetów z kopią manifestu testowego; serwer plików wystawia cały ten folder."""
    folder = tmp_path / "assets"
    folder.mkdir()
    (folder / "manifest.json").write_bytes(assets_manifest.read_bytes())
    return folder


@pytest.fixture
def client(assets_dir) -> TestClient:
    return make_client(assets_dir / "manifest.json")


def put_png(assets_dir: Path, file: str) -> None:
    """Zapisuje FAKE_PNG w folderze assetów pod ścieżką z pola file assetu."""
    path = assets_dir / file
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(FAKE_PNG)


def ids(response) -> list[str]:
    return [asset["id"] for asset in response.json()]


def test_list_assets_returns_all_assets_with_all_fields(client):
    response = client.get("/api/assets")

    assert response.status_code == 200
    assert ids(response) == ["char_hair_short_01", "map_rock_01", "map_tree_oak_01"]
    assert response.json()[-1] == {
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


def test_app_creates_missing_assets_folder_on_start(tmp_path):
    make_client(tmp_path / "assets" / "manifest.json")

    assert (tmp_path / "assets").is_dir()


def test_png_is_served_from_manifest_folder_under_file_path(client, assets_dir):
    put_png(assets_dir, "map/trees/map_tree_oak_01.png")

    response = client.get("/static/assets/map/trees/map_tree_oak_01.png")

    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content == FAKE_PNG


def test_png_response_allows_frontend_origin(client, assets_dir):
    # Nagłówek CORS pozwala frontendowi czytać piksele obrazka narysowanego na canvasie.
    put_png(assets_dir, "map/rocks/map_rock_01.png")

    response = client.get("/static/assets/map/rocks/map_rock_01.png", headers={"Origin": "http://localhost:5173"})

    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_missing_png_returns_not_found_in_error_format(client):
    response = client.get("/static/assets/map/trees/missing.png")

    assert response.status_code == 404
    assert response.json() == {"error": {"code": "NOT_FOUND", "messageKey": "errors.notFound", "details": {}}}
