"""Repozytoria w pamięci: pozwalają uruchomić API i testy bez bazy danych.

Assety pochodzą z pliku manifest.json, który jest listą obiektów Asset w JSON.
"""

from pathlib import Path

from pydantic import TypeAdapter

from src.schemas.asset import Asset

# TypeAdapter sprawdza typ, który nie jest modelem Pydantic (tu: lista Asset), według tych samych reguł co model.
ASSET_LIST = TypeAdapter(list[Asset])


def load_manifest(path: Path) -> list[Asset]:
    """Czyta manifest i zwraca listę assetów; błędny wpis zgłasza ValidationError, powtórzone id ValueError.

    Brak pliku oznacza pustą bibliotekę, żeby serwer startował, zanim pojawią się pierwsze assety.
    """
    if not path.exists():
        return []
    # utf-8-sig pomija znacznik BOM, który na Windows dopisują np. Notatnik i PowerShell 5.1.
    assets = ASSET_LIST.validate_json(path.read_text(encoding="utf-8-sig"))
    check_unique_ids(assets)
    return assets


def check_unique_ids(assets: list[Asset]) -> None:
    """Zgłasza ValueError, gdy dwa assety mają to samo id; scena odwołuje się do assetu tylko przez id."""
    seen: set[str] = set()
    for asset in assets:
        if asset.id in seen:
            raise ValueError(f"Powtórzone id assetu w manifeście: {asset.id}")
        seen.add(asset.id)


class InMemoryAssetRepository:
    """Biblioteka assetów trzymana w liście; spełnia interfejs AssetRepository z ports.py."""

    def __init__(self, assets: list[Asset]):
        self._assets = list(assets)

    def list_assets(self, module: str | None = None, category: str | None = None) -> list[Asset]:
        """Zwraca assety w kolejności z manifestu, pasujące do podanych filtrów."""
        return [
            asset
            for asset in self._assets
            if (module is None or asset.module == module) and (category is None or asset.category == category)
        ]
