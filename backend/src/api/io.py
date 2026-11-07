"""Endpointy importu i eksportu projektów jako plików .worldsmith.json."""

from fastapi import APIRouter, Depends, Response

from src.deps import get_project_repository
from src.ports import ProjectRepository
from src.schemas.scene import Scene
from src.services import projects as project_service
from src.services.import_export import export_filename

router = APIRouter()


# Treść pliku to ta sama Scene co w GET /api/projects/{id}; różni się tylko nagłówkiem.
# Argument typu Response pozwala dopisać nagłówki do odpowiedzi, którą FastAPI zbuduje z wyniku funkcji.
@router.get("/api/projects/{project_id}/export")
def export_project(
    project_id: str,
    response: Response,
    projects: ProjectRepository = Depends(get_project_repository),
) -> Scene:
    scene = project_service.get_project(projects, project_id)
    # attachment: przeglądarka zapisuje odpowiedź jako plik o podanej nazwie zamiast ją wyświetlać.
    response.headers["Content-Disposition"] = f'attachment; filename="{export_filename(scene.name)}"'
    return scene
