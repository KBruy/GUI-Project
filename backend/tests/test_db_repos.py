"""Testy repozytoriów w bazie (src/db_repos.py) na prawdziwym PostgreSQL; bez działającej bazy są pomijane."""

from collections.abc import Iterator
from pathlib import Path

import pytest
from sqlalchemy import Engine
from sqlalchemy.orm import Session, sessionmaker

from src.db.seed import seed
from src.db_repos import DbAssetRepository, DbProjectRepository
from src.dev.memory_repos import InMemoryAssetRepository, load_manifest
from src.schemas.project import ProjectSummary
from src.schemas.scene import Scene

# Id projektów muszą być UUID, bo taki typ ma kolumna projects.id.
OLD_ID = "00000000-0000-4000-8000-000000000001"
MIDDLE_ID = "00000000-0000-4000-8000-000000000002"
NEWEST_ID = "00000000-0000-4000-8000-000000000003"


@pytest.fixture
def session_factory(engine: Engine) -> Iterator[sessionmaker[Session]]:
    """Fabryka sesji działających w jednej transakcji, cofanej po teście.

    create_savepoint: commit w repozytorium zatwierdza tylko savepoint, więc testy nie widzą swoich danych.
    """
    with engine.connect() as connection:
        transaction = connection.begin()
        yield sessionmaker(bind=connection, join_transaction_mode="create_savepoint")
        transaction.rollback()


@pytest.fixture
def asset_repository(session_factory: sessionmaker[Session], assets_manifest: Path) -> DbAssetRepository:
    """Repozytorium assetów nad bazą wypełnioną seedem z testowego manifestu."""
    with session_factory() as db:
        seed(db, load_manifest(assets_manifest))
        db.commit()
    return DbAssetRepository(session_factory)


def test_db_assets_are_the_same_as_in_memory(asset_repository: DbAssetRepository, assets_manifest: Path):
    memory_repository = InMemoryAssetRepository(load_manifest(assets_manifest))
    assert asset_repository.list_assets() == memory_repository.list_assets()


def test_db_assets_filtered_by_module(asset_repository: DbAssetRepository):
    ids = [asset.id for asset in asset_repository.list_assets(module="map")]
    assert ids == ["map_rock_01", "map_tree_oak_01"]


def test_db_assets_filtered_by_category(asset_repository: DbAssetRepository):
    ids = [asset.id for asset in asset_repository.list_assets(category="trees")]
    assert ids == ["map_tree_oak_01"]


def test_db_assets_category_from_other_module_gives_empty_list(asset_repository: DbAssetRepository):
    assert asset_repository.list_assets(module="character", category="trees") == []


def test_db_assets_empty_database_gives_empty_list(session_factory: sessionmaker[Session]):
    assert DbAssetRepository(session_factory).list_assets() == []


@pytest.fixture
def projects(session_factory: sessionmaker[Session]) -> DbProjectRepository:
    """Repozytorium projektów nad pustą tabelą projects."""
    return DbProjectRepository(session_factory)


def make_scene(scene_data: dict, project_id: str, scene_type: str = "map", updated_at: str = "2026-10-26T12:00:00Z") -> Scene:
    """Zwraca scenę z podanym id, typem i datą zmiany; reszta pól z fixture scene_data."""
    return Scene.model_validate({**scene_data, "id": project_id, "type": scene_type, "updatedAt": updated_at})


def test_db_saved_project_can_be_read_back(projects: DbProjectRepository, scene_data: dict):
    scene = make_scene(scene_data, OLD_ID)

    projects.save_project(scene)

    assert projects.get_project(OLD_ID) == scene


def test_db_get_unknown_project_returns_none(projects: DbProjectRepository):
    assert projects.get_project(OLD_ID) is None


def test_db_get_project_with_id_that_is_not_uuid_returns_none(projects: DbProjectRepository):
    assert projects.get_project("missing") is None


def test_db_save_project_with_existing_id_overwrites_it(projects: DbProjectRepository, scene_data: dict):
    projects.save_project(make_scene(scene_data, OLD_ID))
    changed = make_scene(scene_data, OLD_ID).model_copy(update={"name": "Nowa nazwa"})

    projects.save_project(changed)

    assert projects.get_project(OLD_ID).name == "Nowa nazwa"
    assert [project.name for project in projects.list_projects()] == ["Nowa nazwa"]


def test_db_delete_project_removes_it(projects: DbProjectRepository, scene_data: dict):
    projects.save_project(make_scene(scene_data, OLD_ID))

    assert projects.delete_project(OLD_ID) is True
    assert projects.get_project(OLD_ID) is None


def test_db_delete_unknown_project_returns_false(projects: DbProjectRepository):
    assert projects.delete_project(OLD_ID) is False


def test_db_list_projects_returns_summaries_without_scene(projects: DbProjectRepository, scene_data: dict):
    scene = make_scene(scene_data, OLD_ID)
    projects.save_project(scene)

    assert projects.list_projects() == [
        ProjectSummary(id=OLD_ID, type="map", name="Wioska", createdAt=scene.createdAt, updatedAt=scene.updatedAt)
    ]


def test_db_list_projects_sorts_by_updated_at_newest_first(projects: DbProjectRepository, scene_data: dict):
    projects.save_project(make_scene(scene_data, OLD_ID, updated_at="2026-10-01T10:00:00Z"))
    projects.save_project(make_scene(scene_data, NEWEST_ID, updated_at="2026-10-03T10:00:00Z"))
    projects.save_project(make_scene(scene_data, MIDDLE_ID, updated_at="2026-10-02T10:00:00Z"))

    assert [project.id for project in projects.list_projects()] == [NEWEST_ID, MIDDLE_ID, OLD_ID]


def test_db_list_projects_filters_by_type(projects: DbProjectRepository, scene_data: dict):
    projects.save_project(make_scene(scene_data, OLD_ID))
    projects.save_project(make_scene(scene_data, NEWEST_ID, scene_type="character"))

    assert [project.id for project in projects.list_projects(scene_type="character")] == [NEWEST_ID]
    assert [project.id for project in projects.list_projects(scene_type="map")] == [OLD_ID]
