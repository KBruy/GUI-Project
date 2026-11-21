"""Testy wyboru repozytoriów w deps.py; samo utworzenie repozytorium w bazie nie łączy się z bazą."""

from src.config import DEFAULT_DATABASE_URL, Settings
from src.db_repos import DbAssetRepository, DbProjectRepository
from src.deps import build_asset_repository, build_project_repository
from src.dev.memory_repos import InMemoryAssetRepository, InMemoryProjectRepository


def test_without_database_url_repositories_are_in_memory():
    settings = Settings(client_origins=[])

    assert isinstance(build_asset_repository(settings), InMemoryAssetRepository)
    assert isinstance(build_project_repository(settings), InMemoryProjectRepository)


def test_with_database_url_repositories_use_database():
    settings = Settings(client_origins=[], database_url=DEFAULT_DATABASE_URL)

    assert isinstance(build_asset_repository(settings), DbAssetRepository)
    assert isinstance(build_project_repository(settings), DbProjectRepository)
