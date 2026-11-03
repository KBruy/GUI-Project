"""Endpoint /api/assets: lista assetów z biblioteki, z opcjonalnymi filtrami."""

from fastapi import APIRouter, Depends

from src.deps import get_asset_repository
from src.ports import AssetRepository
from src.schemas.asset import Asset
from src.schemas.base import Module

router = APIRouter()


# Proste parametry funkcji (module, category) FastAPI czyta z adresu: /api/assets?module=map&category=trees.
# Module ogranicza filtr do dozwolonych modułów; inna wartość kończy się 422 VALIDATION_FAILED.
@router.get("/api/assets")
def list_assets(
    module: Module | None = None,
    category: str | None = None,
    # Depends: FastAPI wywołuje get_asset_repository przy każdym zapytaniu i przekazuje wynik jako repo.
    repo: AssetRepository = Depends(get_asset_repository),
) -> list[Asset]:
    return repo.list_assets(module=module, category=category)
