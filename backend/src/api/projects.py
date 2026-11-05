"""Endpointy /api/projects: lista, odczyt i usuwanie projektów."""

from fastapi import APIRouter, Depends, Query

from src.deps import get_project_repository
from src.ports import ProjectRepository
from src.schemas.base import Module
from src.schemas.project import ProjectSummary
from src.schemas.scene import Scene
from src.services import projects as project_service

router = APIRouter()


# Query(alias="type"): parametr w adresie nazywa się type (?type=map), a w Pythonie scene_type,
# bo type to wbudowana funkcja Pythona.
@router.get("/api/projects")
def list_projects(
    scene_type: Module | None = Query(None, alias="type"),
    projects: ProjectRepository = Depends(get_project_repository),
) -> list[ProjectSummary]:
    return projects.list_projects(scene_type=scene_type)


# {project_id} w ścieżce FastAPI przekazuje jako argument o tej samej nazwie.
@router.get("/api/projects/{project_id}")
def get_project(project_id: str, projects: ProjectRepository = Depends(get_project_repository)) -> Scene:
    return project_service.get_project(projects, project_id)


# status_code=204: odpowiedź bez treści, gdy projekt został usunięty.
@router.delete("/api/projects/{project_id}", status_code=204)
def delete_project(project_id: str, projects: ProjectRepository = Depends(get_project_repository)) -> None:
    project_service.delete_project(projects, project_id)
