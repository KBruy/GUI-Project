"""Testy repozytoriów w pamięci: odczyt manifestu i filtrowanie assetów."""

import json

import pytest
from pydantic import ValidationError

from src.dev.memory_repos import InMemoryAssetRepository, load_manifest
from src.schemas.asset import Asset


@pytest.fixture
def repo(assets_manifest) -> InMemoryAssetRepository:
    return InMemoryAssetRepository(load_manifest(assets_manifest))


def ids(assets: list[Asset]) -> list[str]:
    return [asset.id for asset in assets]


def make_asset(asset_id: str, module: str, category: str) -> Asset:
    """Tworzy asset; w testach kolejności liczą się tylko id, moduł i kategoria."""
    return Asset(
        id=asset_id,
        module=module,
        category=category,
        nameKey=f"assets.{module}.{asset_id}",
        file=f"{module}/{category}/{asset_id}.png",
        width=32,
        height=32,
    )


def test_list_assets_sorts_by_module_then_category_then_id():
    repo = InMemoryAssetRepository([
        make_asset("map_tree_pine_01", "map", "trees"),
        make_asset("map_rock_02", "map", "rocks"),
        make_asset("char_hair_short_01", "character", "hair"),
        make_asset("map_tree_oak_01", "map", "trees"),
        make_asset("map_rock_01", "map", "rocks"),
    ])

    assert ids(repo.list_assets()) == [
        "char_hair_short_01",
        "map_rock_01",
        "map_rock_02",
        "map_tree_oak_01",
        "map_tree_pine_01",
    ]


def test_load_manifest_reads_all_assets(assets_manifest):
    assets = load_manifest(assets_manifest)

    assert ids(assets) == ["map_tree_oak_01", "map_rock_01", "char_hair_short_01"]
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


def test_load_manifest_accepts_utf8_bom(tmp_path, assets_manifest):
    manifest = tmp_path / "manifest.json"
    manifest.write_bytes(b"\xef\xbb\xbf" + assets_manifest.read_bytes())

    assert len(load_manifest(manifest)) == 3


def test_load_manifest_rejects_duplicate_ids(tmp_path, assets_manifest):
    entries = json.loads(assets_manifest.read_text(encoding="utf-8"))
    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps([*entries, entries[1]]), encoding="utf-8")

    # match sprawdza, czy komunikat błędu wskazuje powtórzone id.
    with pytest.raises(ValueError, match="map_rock_01"):
        load_manifest(manifest)


def test_list_assets_without_filters_returns_all(repo):
    assert ids(repo.list_assets()) == ["char_hair_short_01", "map_rock_01", "map_tree_oak_01"]


def test_list_assets_filters_by_module(repo):
    assert ids(repo.list_assets(module="map")) == ["map_rock_01", "map_tree_oak_01"]


def test_list_assets_filters_by_category(repo):
    assert ids(repo.list_assets(category="hair")) == ["char_hair_short_01"]


def test_list_assets_filters_by_module_and_category(repo):
    assert ids(repo.list_assets(module="map", category="rocks")) == ["map_rock_01"]


def test_list_assets_with_unknown_category_returns_empty_list(repo):
    assert repo.list_assets(module="map", category="hair") == []
