"""Operacje na projektach: sprawdzenie reguł sceny, nadanie id i dat, zapis w repozytorium.

Funkcje nie znają HTTP: błąd zgłaszają jako AppError, który handler z error_handlers.py zamienia na odpowiedź JSON.
"""

from datetime import datetime, timezone
from uuid import uuid4

from src.errors import AppError
from src.ports import AssetRepository, ProjectRepository
from src.schemas.asset import Asset
from src.schemas.scene import Scene
from src.services.validation import check_scene


def get_project(projects: ProjectRepository, project_id: str) -> Scene:
    """Zwraca scenę projektu; brak projektu → 404 PROJECT_NOT_FOUND."""
    scene = projects.get_project(project_id)
    if scene is None:
        raise AppError("PROJECT_NOT_FOUND", 404)
    return scene


def delete_project(projects: ProjectRepository, project_id: str) -> None:
    """Usuwa projekt; brak projektu → 404 PROJECT_NOT_FOUND."""
    if not projects.delete_project(project_id):
        raise AppError("PROJECT_NOT_FOUND", 404)


def create_project(projects: ProjectRepository, assets: AssetRepository, scene: Scene) -> Scene:
    """Sprawdza reguły sceny i zapisuje ją jako nowy projekt; zwraca zapisaną scenę.

    Serwer nadaje nowe id oraz createdAt = updatedAt = teraz; wartości z ciała zapytania są pomijane.
    Id warstw i obiektów zostają bez zmian.
    """
    ensure_valid(scene, assets)
    now = utc_now()
    # model_copy tworzy kopię modelu z podmienionymi polami; scena z argumentu zostaje bez zmian.
    saved = scene.model_copy(update={"id": str(uuid4()), "createdAt": now, "updatedAt": now})
    projects.save_project(saved)
    return saved


def ensure_valid(scene: Scene, assets: AssetRepository) -> None:
    """Zgłasza 422 VALIDATION_FAILED ze wszystkimi problemami sceny, gdy scena łamie reguły."""
    issues = check_scene(scene, asset_library(assets))
    if issues:
        raise AppError("VALIDATION_FAILED", 422, issues)


def asset_library(assets: AssetRepository) -> dict[str, Asset]:
    """Zwraca bibliotekę assetów jako słownik id → Asset, w postaci, której wymaga check_scene."""
    return {asset.id: asset for asset in assets.list_assets()}


def utc_now() -> datetime:
    """Zwraca bieżący czas ze strefą UTC; w JSON-ie zapisuje się jako ISO 8601 ze znakiem Z."""
    return datetime.now(timezone.utc)
