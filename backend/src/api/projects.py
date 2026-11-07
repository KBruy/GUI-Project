"""Endpointy /api/projects: lista, odczyt, tworzenie, zapis i usuwanie projektów."""

from fastapi import APIRouter, Depends

from src.deps import get_asset_repository, get_project_repository
from src.ports import AssetRepository, ProjectRepository
from src.schemas.base import Module
from src.schemas.project import ProjectSummary
from src.schemas.scene import Scene
from src.services import projects as project_service

router = APIRouter()


# Parametr type FastAPI czyta z adresu (?type=map); zasłania wbudowane type(), które w tej funkcji nie jest używane.
@router.get("/api/projects")
def list_projects(
    type: Module | None = None,
    projects: ProjectRepository = Depends(get_project_repository),
) -> list[ProjectSummary]:
    return projects.list_projects(scene_type=type)


# {project_id} w ścieżce FastAPI przekazuje jako argument o tej samej nazwie.
@router.get("/api/projects/{project_id}")
def get_project(project_id: str, projects: ProjectRepository = Depends(get_project_repository)) -> Scene:
    return project_service.get_project(projects, project_id)


# Argument typu Scene FastAPI czyta z ciała zapytania (JSON) i sprawdza modelem; zły kształt → 422 INVALID_FIELD.
# status_code=201: utworzono nowy zasób.
@router.post("/api/projects", status_code=201)
def create_project(
    scene: Scene,
    projects: ProjectRepository = Depends(get_project_repository),
    assets: AssetRepository = Depends(get_asset_repository),
) -> Scene:
    return project_service.create_project(projects, assets, scene)


# Zapis zawsze wysyła całą scenę (także autosave); id projektu pochodzi z adresu.
@router.put("/api/projects/{project_id}")
def update_project(
    project_id: str,
    scene: Scene,
    projects: ProjectRepository = Depends(get_project_repository),
    assets: AssetRepository = Depends(get_asset_repository),
) -> Scene:
    return project_service.update_project(projects, assets, project_id, scene)


# status_code=204: odpowiedź bez treści, gdy projekt został usunięty.
@router.delete("/api/projects/{project_id}", status_code=204)
def delete_project(project_id: str, projects: ProjectRepository = Depends(get_project_repository)) -> None:
    project_service.delete_project(projects, project_id)
