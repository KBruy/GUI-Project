"""Wybór implementacji repozytoriów i ich wstrzykiwanie do endpointów.

Zamiana wersji w pamięci na bazę danych wymaga zmian tylko w tym pliku.
"""

from pathlib import Path

from fastapi import Request

from src.config import Settings
from src.db.session import SessionLocal
from src.db_repos import DbAssetRepository, DbProjectRepository
from src.dev.memory_repos import InMemoryAssetRepository, InMemoryProjectRepository, load_manifest
from src.ports import AssetRepository, ProjectRepository


def build_asset_repository(settings: Settings) -> AssetRepository:
    """Tworzy repozytorium assetów raz, przy starcie aplikacji: w bazie albo z manifestu, gdy nie ma database_url."""
    if settings.database_url is None:
        return InMemoryAssetRepository(load_manifest(settings.assets_manifest))
    # SessionLocal (src/db/session.py) łączy się z adresem z load_settings, czyli tym samym co settings.database_url.
    return DbAssetRepository(SessionLocal)


def build_project_repository(settings: Settings) -> ProjectRepository:
    """Tworzy repozytorium projektów raz, przy starcie aplikacji; w pamięci projekty znikają po zatrzymaniu serwera."""
    if settings.database_url is None:
        return InMemoryProjectRepository()
    return DbProjectRepository(SessionLocal)


def assets_files_dir(settings: Settings) -> Path:
    """Zwraca folder z plikami PNG assetów; pole file assetu to ścieżka względem tego folderu.

    To folder manifestu (assets/), bo z niego pochodzą ścieżki file, także te zapisane w bazie przez seed.
    """
    return settings.assets_manifest.parent


def get_asset_repository(request: Request) -> AssetRepository:
    """Zwraca repozytorium assetów zapisane w aplikacji przez create_app (main.py)."""
    return request.app.state.asset_repository


def get_project_repository(request: Request) -> ProjectRepository:
    """Zwraca repozytorium projektów zapisane w aplikacji przez create_app (main.py)."""
    return request.app.state.project_repository
