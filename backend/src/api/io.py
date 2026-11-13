"""Endpointy importu i eksportu projektów jako plików .worldsmith.json."""

from fastapi import APIRouter, Depends, File, Response, UploadFile

from src.deps import get_asset_repository, get_project_repository
from src.ports import AssetRepository, ProjectRepository
from src.schemas.scene import Scene
from src.services import projects as project_service
from src.services.import_export import export_filename, parse_import_file

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


# File(...) każe FastAPI czytać pole "file" z formularza multipart; brak pola → 422 INVALID_FIELD.
# Plik staje się nowym projektem: serwer nadaje nowe id i daty, reguły sceny sprawdza create_project (422).
@router.post("/api/projects/import", status_code=201)
def import_project(
    file: UploadFile = File(...),
    projects: ProjectRepository = Depends(get_project_repository),
    assets: AssetRepository = Depends(get_asset_repository),
) -> Scene:
    # file.file to zwykły plik Pythona; read() zwraca całą zawartość jako bajty.
    scene = parse_import_file(file.file.read())
    return project_service.create_project(projects, assets, scene)
