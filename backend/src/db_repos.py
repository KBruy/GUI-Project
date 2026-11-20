"""Repozytoria w bazie danych: spełniają interfejsy z ports.py, korzystając z funkcji z src/db/repositories/.

Funkcje bazy zwracają modele SQLAlchemy; tu są zamieniane na modele Pydantic z kontraktu.
Każda metoda otwiera własną sesję, więc jeden obiekt repozytorium obsługuje wszystkie zapytania aplikacji.
"""

from sqlalchemy.orm import Session, sessionmaker

from src.db.repositories import assets as asset_queries
from src.schemas.asset import Asset


class DbAssetRepository:
    """Biblioteka assetów z tabel assets i asset_categories; spełnia interfejs AssetRepository z ports.py."""

    # sessionmaker to fabryka: każde wywołanie session_factory() tworzy nową sesję bazy.
    def __init__(self, session_factory: sessionmaker[Session]):
        self._session_factory = session_factory

    def list_assets(self, module: str | None = None, category: str | None = None) -> list[Asset]:
        """Zwraca assety pasujące do filtrów; moduł i kategoria pochodzą z kategorii assetu (row.category)."""
        # with zamyka sesję po odczycie, a połączenie wraca do puli.
        with self._session_factory() as db:
            rows = asset_queries.list_assets(db, module, category)
            return [
                Asset(
                    id=row.id,
                    module=row.category.module,
                    category=row.category.key,
                    nameKey=row.name_key,
                    file=row.file_path,
                    width=row.width,
                    height=row.height,
                )
                for row in rows
            ]
