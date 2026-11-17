"""Zapytania do bazy o projekty map i postaci (repozytorium).

Funkcje zwracają modele SQLAlchemy (Project); zamianą na modele Pydantic
(Scene, ProjectSummary) zajmuje się backend.
Id i daty nadaje serwis (services/projects.py); repozytorium przepisuje je ze sceny do kolumn.
Sesję przekazuje wywołujący: funkcje robią najwyżej flush, nigdy commit.
Brak projektu nie jest błędem: zwracają None albo False.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.db.models import Project
from src.schemas.scene import Scene


def get_project(db: Session, project_id: str) -> Project | None:
    """Zwraca projekt o podanym id z pełną sceną. Zwraca None, gdy projektu nie ma albo project_id nie jest poprawnym UUID."""
    try:
        project_uuid = uuid.UUID(project_id)
    except ValueError:
        return None
    stmt = select(Project).where(Project.id == project_uuid)
    return db.scalar(stmt)


def create_project(db: Session, scene: Scene) -> Project:
    """Tworzy nowy projekt na podstawie sceny."""
    project = Project(
        id=uuid.UUID(Scene.id),
        type=Scene.type,
        name=Scene.name,
        schema_version=Scene.schemaVersion,
        created_at=Scene.createdAt,
        updated_at=Scene.updatedAt,
        scene=Scene.model_dump(mode="json"),
    )
    db.add(project)
    db.flush()
    db.refresh(project)
    return project