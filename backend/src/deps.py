"""Wybór implementacji repozytoriów i ich wstrzykiwanie do endpointów.

Zamiana wersji w pamięci na bazę danych wymaga zmian tylko w tym pliku.
"""

from fastapi import Request

from src.config import Settings
from src.dev.memory_repos import InMemoryAssetRepository, load_manifest
from src.ports import AssetRepository


def build_asset_repository(settings: Settings) -> AssetRepository:
    """Tworzy repozytorium assetów raz, przy starcie aplikacji."""
    return InMemoryAssetRepository(load_manifest(settings.assets_manifest))


def get_asset_repository(request: Request) -> AssetRepository:
    """Zwraca repozytorium assetów zapisane w aplikacji przez create_app (main.py)."""
    return request.app.state.asset_repository
