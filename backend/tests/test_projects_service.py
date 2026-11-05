"""Testy serwisu projektów (services/projects.py) na repozytoriach w pamięci, bez serwera."""

from datetime import datetime, timezone
from uuid import UUID

import pytest

from src.dev.memory_repos import InMemoryAssetRepository, InMemoryProjectRepository, load_manifest
from src.errors import AppError
from src.schemas.scene import Scene
from src.services.projects import create_project, delete_project, get_project


@pytest.fixture
def projects() -> InMemoryProjectRepository:
    return InMemoryProjectRepository()


@pytest.fixture
def assets(assets_manifest) -> InMemoryAssetRepository:
    return InMemoryAssetRepository(load_manifest(assets_manifest))


@pytest.fixture
def scene(scene_data) -> Scene:
    return Scene.model_validate(scene_data)


def test_create_project_assigns_new_uuid(projects, assets, scene):
    saved = create_project(projects, assets, scene)

    assert saved.id != scene.id
    # UUID() rzuca ValueError, gdy napis nie jest poprawnym UUID.
    assert str(UUID(saved.id)) == saved.id


def test_create_project_sets_both_dates_to_now(projects, assets, scene):
    before = datetime.now(timezone.utc)
    saved = create_project(projects, assets, scene)
    after = datetime.now(timezone.utc)

    assert saved.createdAt == saved.updatedAt
    assert before <= saved.createdAt <= after


def test_create_project_keeps_rest_of_scene(projects, assets, scene):
    saved = create_project(projects, assets, scene)

    assert saved.model_dump(exclude={"id", "createdAt", "updatedAt"}) == scene.model_dump(
        exclude={"id", "createdAt", "updatedAt"}
    )


def test_create_project_saves_scene_in_repository(projects, assets, scene):
    saved = create_project(projects, assets, scene)

    assert projects.get_project(saved.id) == saved


def test_create_project_rejects_invalid_scene_with_all_issues(projects, assets, scene_data):
    scene_data["name"] = " "
    scene_data["layers"][0]["objects"][0]["assetId"] = "missing_asset"

    with pytest.raises(AppError) as error:
        create_project(projects, assets, Scene.model_validate(scene_data))

    assert error.value.code == "VALIDATION_FAILED"
    assert error.value.status_code == 422
    assert [issue.code for issue in error.value.issues] == ["NAME_REQUIRED", "ASSET_NOT_FOUND"]
    assert projects.list_projects() == []


def test_get_project_returns_saved_scene(projects, assets, scene):
    saved = create_project(projects, assets, scene)

    assert get_project(projects, saved.id) == saved


def test_get_unknown_project_raises_project_not_found(projects):
    with pytest.raises(AppError) as error:
        get_project(projects, "missing")

    assert error.value.code == "PROJECT_NOT_FOUND"
    assert error.value.status_code == 404


def test_delete_project_removes_it(projects, assets, scene):
    saved = create_project(projects, assets, scene)

    delete_project(projects, saved.id)

    assert projects.get_project(saved.id) is None


def test_delete_unknown_project_raises_project_not_found(projects):
    with pytest.raises(AppError) as error:
        delete_project(projects, "missing")

    assert error.value.code == "PROJECT_NOT_FOUND"
    assert error.value.status_code == 404
