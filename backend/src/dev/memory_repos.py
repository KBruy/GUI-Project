"""Repozytoria w pamięci: pozwalają uruchomić API i testy bez bazy danych.

Assety pochodzą z pliku manifest.json, który jest listą obiektów Asset w JSON.
Projekty istnieją tylko do zatrzymania serwera.
"""

from pathlib import Path

from pydantic import TypeAdapter

from src.schemas.asset import Asset
from src.schemas.project import ProjectSummary
from src.schemas.scene import Scene

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


def sort_assets(assets: list[Asset]) -> list[Asset]:
    """Układa assety po module, kategorii i id; ta sama kolejność co ORDER BY w repozytorium bazodanowym."""
    return sorted(assets, key=lambda asset: (asset.module, asset.category, asset.id))


class InMemoryAssetRepository:
    """Biblioteka assetów trzymana w liście; spełnia interfejs AssetRepository z ports.py."""

    def __init__(self, assets: list[Asset]):
        # Sortowanie raz, przy tworzeniu; filtrowanie zachowuje tę kolejność.
        self._assets = sort_assets(assets)

    def list_assets(self, module: str | None = None, category: str | None = None) -> list[Asset]:
        """Zwraca assety pasujące do podanych filtrów, w kolejności z sort_assets."""
        return [
            asset
            for asset in self._assets
            if (module is None or asset.module == module) and (category is None or asset.category == category)
        ]


def summary_of(scene: Scene) -> ProjectSummary:
    """Zwraca dane projektu do listy projektów, bez warstw i obiektów sceny."""
    return ProjectSummary(
        id=scene.id,
        type=scene.type,
        name=scene.name,
        createdAt=scene.createdAt,
        updatedAt=scene.updatedAt,
    )


class InMemoryProjectRepository:
    """Projekty trzymane w słowniku id projektu → Scene; spełnia interfejs ProjectRepository z ports.py."""

    def __init__(self):
        self._scenes: dict[str, Scene] = {}

    def list_projects(self, scene_type: str | None = None) -> list[ProjectSummary]:
        """Zwraca projekty danego typu (None = wszystkie), od ostatnio zmienionego."""
        scenes = [scene for scene in self._scenes.values() if scene_type is None or scene.type == scene_type]
        # reverse=True: od najnowszej daty updatedAt do najstarszej.
        scenes.sort(key=lambda scene: scene.updatedAt, reverse=True)
        return [summary_of(scene) for scene in scenes]

    def get_project(self, project_id: str) -> Scene | None:
        return self._scenes.get(project_id)

    def save_project(self, scene: Scene) -> None:
        self._scenes[scene.id] = scene

    def delete_project(self, project_id: str) -> bool:
        # pop zwraca usuniętą scenę albo None, gdy klucza nie było.
        return self._scenes.pop(project_id, None) is not None
