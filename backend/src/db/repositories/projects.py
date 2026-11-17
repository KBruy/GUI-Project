"""Zapytania do bazy o projekty map i postaci (repozytorium).

Funkcje zwracają modele SQLAlchemy (Project); zamianą na modele Pydantic
(Scene, ProjectSummary) zajmuje się backend.
Id i daty nadaje serwis (services/projects.py); repozytorium przepisuje je ze sceny do kolumn.
Sesję przekazuje wywołujący: funkcje robią najwyżej flush, nigdy commit.
Brak projektu nie jest błędem: zwracają None albo False.
"""

import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session, load_only

from src.db.models import Project
from src.schemas.scene import Scene


def list_projects(db: Session, scene_type: str | None = None) -> Sequence[Project]:
    """Zwraca projekty od ostatnio zmienionego (updated_at malejąco, przy remisie po id).
    Ładuje tylko kolumny potrzebne na liście (bez scene); odczyt project.scene rzuca błąd.
    scene_type None oznacza wszystkie typy; gdy nic nie pasuje, zwraca pustą listę.
    """
    stmt = select(Project).options(load_only(Project.id, Project.type, Project.name, Project.created_at, Project.updated_at, raiseload=True,)).order_by(Project.updated_at.desc(), Project.id)
    if scene_type is not None:
        stmt = stmt.where(Project.type == scene_type)
    return db.scalars(stmt).all()


def get_project(db: Session, project_id: str) -> Project | None:
    """Zwraca projekt o podanym id z pełną sceną.
    Zwraca None, gdy projektu nie ma albo project_id nie jest poprawnym UUID.
    """
    try:
        project_uuid = uuid.UUID(project_id)
    except ValueError:
        return None
    stmt = select(Project).where(Project.id == project_uuid)
    return db.scalar(stmt)


def create_project(db: Session, scene: Scene) -> Project:
    """Tworzy projekt ze sceny i zwraca go.
    Id, typ, nazwę, wersję schematu i daty bierze ze sceny (id i daty nadaje serwis).
    Robi flush, więc błąd bazy (np. zajęte id) wychodzi od razu; commit robi wywołujący.
    """
    project = Project(
        id=uuid.UUID(scene.id),
        type=scene.type,
        name=scene.name,
        schema_version=scene.schemaVersion,
        created_at=scene.createdAt,
        updated_at=scene.updatedAt,
        scene=scene.model_dump(mode="json"),
    )
    db.add(project)
    db.flush()
    return project


def update_project(db: Session, project_id: str, scene: Scene) -> Project | None:
    """Podmienia scenę, nazwę, wersję schematu i updated_at projektu; zwraca zmieniony projekt.
    updated_at bierze ze sceny (nadaje go serwis); created_at i type zostają bez zmian.
    Zwraca None, gdy projektu nie ma. Robi flush, commit robi wywołujący.
    """
    project = get_project(db, project_id)
    if project is None:
        return None
    project.name = scene.name
    project.schema_version = scene.schemaVersion
    project.updated_at = scene.updatedAt
    project.scene = scene.model_dump(mode="json")
    db.flush()
    return project


def delete_project(db: Session, project_id: str) -> bool:
    """Usuwa projekt o podanym id.
    Zwraca True, gdy projekt istniał i został usunięty, False w przeciwnym razie.
    Robi flush, commit robi wywołujący.
    """
    project = get_project(db, project_id)
    if project is None:
        return False
    db.delete(project)
    db.flush()
    return True