"""Repozytoria w bazie danych: spełniają interfejsy z ports.py, korzystając z funkcji z src/db/repositories/.

Funkcje bazy zwracają modele SQLAlchemy; tu są zamieniane na modele Pydantic z kontraktu.
Każda metoda otwiera własną sesję, więc jeden obiekt repozytorium obsługuje wszystkie zapytania aplikacji.
"""

from sqlalchemy.orm import Session, sessionmaker

from src.db.repositories import assets as asset_queries
from src.db.repositories import projects as project_queries
from src.schemas.asset import Asset
from src.schemas.project import ProjectSummary
from src.schemas.scene import Scene


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


class DbProjectRepository:
    """Projekty z tabeli projects; spełnia interfejs ProjectRepository z ports.py.

    Cała scena leży w kolumnie scene (JSONB); kolumny id, type, name i daty służą do listy i sortowania.
    """

    def __init__(self, session_factory: sessionmaker[Session]):
        self._session_factory = session_factory

    def list_projects(self, scene_type: str | None = None) -> list[ProjectSummary]:
        """Zwraca projekty danego typu (None = wszystkie), od ostatnio zmienionego; scena nie jest wczytywana."""
        with self._session_factory() as db:
            rows = project_queries.list_projects(db, scene_type)
            return [
                ProjectSummary(
                    # Kolumna id jest typu UUID, a kontrakt używa napisu.
                    id=str(row.id),
                    type=row.type,
                    name=row.name,
                    createdAt=row.created_at,
                    updatedAt=row.updated_at,
                )
                for row in rows
            ]

    def get_project(self, project_id: str) -> Scene | None:
        """Zwraca scenę projektu albo None, gdy projektu nie ma (także gdy project_id nie jest UUID)."""
        with self._session_factory() as db:
            row = project_queries.get_project(db, project_id)
            if row is None:
                return None
            # Scena w bazie to JSON zapisany z modelu Scene, więc model_validate odtwarza ten sam obiekt.
            return Scene.model_validate(row.scene)

    def save_project(self, scene: Scene) -> None:
        """Nadpisuje projekt o id sceny, a gdy go nie ma, tworzy nowy; commit zatwierdza zmianę w bazie."""
        with self._session_factory() as db:
            if project_queries.update_project(db, scene.id, scene) is None:
                project_queries.create_project(db, scene)
            db.commit()

    def delete_project(self, project_id: str) -> bool:
        """Usuwa projekt; zwraca False, gdy projektu o tym id nie było."""
        with self._session_factory() as db:
            deleted = project_queries.delete_project(db, project_id)
            db.commit()
            return deleted
