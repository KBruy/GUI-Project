"""Testy repozytoriów w pamięci: odczyt manifestu i filtrowanie assetów."""

import pytest
from pydantic import ValidationError

from src.dev.memory_repos import InMemoryAssetRepository, load_manifest
from src.schemas.asset import Asset


@pytest.fixture
def repo(assets_manifest) -> InMemoryAssetRepository:
    return InMemoryAssetRepository(load_manifest(assets_manifest))


def ids(assets: list[Asset]) -> list[str]:
    return [asset.id for asset in assets]


def test_load_manifest_reads_all_assets(assets_manifest):
    assets = load_manifest(assets_manifest)

    assert ids(assets) == ["map_tree_oak_01", "map_rock_01", "character_hair_short_01"]
    assert assets[0].width == 64
    assert assets[0].file == "map/trees/map_tree_oak_01.png"


def test_load_manifest_without_file_returns_empty_list(tmp_path):
    # tmp_path to pusty folder tymczasowy, tworzony przez pytest dla każdego testu.
    assert load_manifest(tmp_path / "manifest.json") == []


def test_load_manifest_rejects_invalid_entry(tmp_path):
    manifest = tmp_path / "manifest.json"
    manifest.write_text('[{"id": "x", "module": "space"}]', encoding="utf-8")

    with pytest.raises(ValidationError):
        load_manifest(manifest)


def test_list_assets_without_filters_returns_all(repo):
    assert ids(repo.list_assets()) == ["map_tree_oak_01", "map_rock_01", "character_hair_short_01"]


def test_list_assets_filters_by_module(repo):
    assert ids(repo.list_assets(module="map")) == ["map_tree_oak_01", "map_rock_01"]


def test_list_assets_filters_by_category(repo):
    assert ids(repo.list_assets(category="hair")) == ["character_hair_short_01"]


def test_list_assets_filters_by_module_and_category(repo):
    assert ids(repo.list_assets(module="map", category="rocks")) == ["map_rock_01"]


def test_list_assets_with_unknown_category_returns_empty_list(repo):
    assert repo.list_assets(module="map", category="hair") == []
