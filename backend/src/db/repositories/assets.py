"""Zapytania do bazy o assety i kategorie assetów (repozytorium).

Funkcje zwracają modele SQLAlchemy (Asset, AssetCategory); zamianą na modele
Pydantic (kontrakt API, camelCase) zajmuje się backend.
Sesję przekazuje wywołujący: funkcje tylko czytają i nie robią commit.
Brak wyników nie jest błędem: zwracają None, pustą listę albo False.
"""

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session, contains_eager

from src.db.models import Asset, AssetCategory


def get_asset(db: Session, asset_id: str) -> Asset | None:
    """Zwraca asset o podanym id lub None, jeśli nie istnieje."""
    stmt = select(Asset).where(Asset.id == asset_id)
    return db.scalar(stmt)


def list_categories(db: Session,module: str)-> Sequence[AssetCategory]:
    """Zwraca listę kategorii assetów dla danego modułu (np. "map" lub "character"), posortowaną po sort_order i id."""
    stmt = select(AssetCategory).where(AssetCategory.module == module).order_by(AssetCategory.sort_order, AssetCategory.id)
    return db.scalars(stmt).all()


def list_assets(db: Session, module: None | str=None, category: None | str=None) -> Sequence[Asset]:
    """Zwraca listę assetów dla danej kategorii i modułu, posortowaną po sort_order kategorii i id assetu. Jeśli module lub category 
    jest None, nie filtruje po tym polu.Każdy asset ma od razu załadowaną kategorię (asset.category), więc odczyt asset.category.key 
    nie wysyła dodatkowych zapytań do bazy.
    """
    stmt = select(Asset).join(Asset.category).options(contains_eager(Asset.category)).order_by(AssetCategory.sort_order, Asset.id)
    if module is not None:
        stmt = stmt.where(AssetCategory.module == module)
    if category is not None:
        stmt = stmt.where(AssetCategory.key == category)
    return db.scalars(stmt).all()


def asset_exists(db: Session, asset_id: str, module: str) -> bool:
    """Zwraca True, jeśli asset o podanym id istnieje w bazie i należy do modułu module (np. "map" lub "character"), False w przeciwnym razie"""
    stmt = select(Asset.id).join(Asset.category).where((Asset.id == asset_id) & (AssetCategory.module == module))
    return db.scalar(select(stmt.exists()))