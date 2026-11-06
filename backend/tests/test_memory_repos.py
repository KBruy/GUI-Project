"""Testy repozytoriów w pamięci: odczyt manifestu, filtrowanie assetów i przechowywanie projektów."""

import json

import pytest
from pydantic import ValidationError

from src.dev.memory_repos import InMemoryAssetRepository, InMemoryProjectRepository, load_manifest
from src.schemas.asset import Asset
from src.schemas.project import ProjectSummary
from src.schemas.scene import Scene


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


def make_scene(scene_data: dict, project_id: str, scene_type: str = "map", updated_at: str = "2026-10-26T12:00:00Z") -> Scene:
    """Tworzy scenę z danych z conftest.py; w testach projektów liczą się tylko id, typ i data zmiany."""
    return Scene.model_validate({**scene_data, "id": project_id, "type": scene_type, "updatedAt": updated_at})


def test_saved_project_can_be_read_back(scene_data):
    projects = InMemoryProjectRepository()
    scene = make_scene(scene_data, "p1")

    projects.save_project(scene)

    assert projects.get_project("p1") == scene


def test_get_unknown_project_returns_none():
    assert InMemoryProjectRepository().get_project("missing") is None


def test_save_project_with_existing_id_overwrites_it(scene_data):
    projects = InMemoryProjectRepository()
    projects.save_project(make_scene(scene_data, "p1"))
    changed = make_scene(scene_data, "p1").model_copy(update={"name": "Nowa nazwa"})

    projects.save_project(changed)

    assert projects.get_project("p1").name == "Nowa nazwa"
    assert len(projects.list_projects()) == 1


def test_delete_project_removes_it(scene_data):
    projects = InMemoryProjectRepository()
    projects.save_project(make_scene(scene_data, "p1"))

    assert projects.delete_project("p1") is True
    assert projects.get_project("p1") is None


def test_delete_unknown_project_returns_false():
    assert InMemoryProjectRepository().delete_project("missing") is False


def test_list_projects_returns_summaries_without_scene(scene_data):
    projects = InMemoryProjectRepository()
    scene = make_scene(scene_data, "p1")
    projects.save_project(scene)

    assert projects.list_projects() == [
        ProjectSummary(id="p1", type="map", name="Wioska", createdAt=scene.createdAt, updatedAt=scene.updatedAt)
    ]


def test_list_projects_sorts_by_updated_at_newest_first(scene_data):
    projects = InMemoryProjectRepository()
    projects.save_project(make_scene(scene_data, "old", updated_at="2026-10-01T10:00:00Z"))
    projects.save_project(make_scene(scene_data, "newest", updated_at="2026-10-03T10:00:00Z"))
    projects.save_project(make_scene(scene_data, "middle", updated_at="2026-10-02T10:00:00Z"))

    assert [project.id for project in projects.list_projects()] == ["newest", "middle", "old"]


def test_list_projects_filters_by_type(scene_data):
    projects = InMemoryProjectRepository()
    projects.save_project(make_scene(scene_data, "map1"))
    projects.save_project(make_scene(scene_data, "hero", scene_type="character"))

    assert [project.id for project in projects.list_projects(scene_type="character")] == ["hero"]
    assert [project.id for project in projects.list_projects(scene_type="map")] == ["map1"]
