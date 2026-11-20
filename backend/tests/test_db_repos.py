"""Testy repozytoriów w bazie (src/db_repos.py) na prawdziwym PostgreSQL; bez działającej bazy są pomijane."""

from collections.abc import Iterator
from pathlib import Path

import pytest
from sqlalchemy import Engine
from sqlalchemy.orm import Session, sessionmaker

from src.db.seed import seed
from src.db_repos import DbAssetRepository
from src.dev.memory_repos import InMemoryAssetRepository, load_manifest


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
