"""Model wpisu na liście projektów: dane projektu bez pełnej sceny."""

from datetime import datetime

from src.schemas.base import ContractModel, Module


class ProjectSummary(ContractModel):
    """Projekt na liście projektów; pełną scenę zwraca dopiero GET /api/projects/{id}."""

    id: str
    type: Module
    name: str
    # Zwykły datetime, nie IsoDateTime ze scene.py: model powstaje w kodzie z gotowych dat, a nie z JSON-a od klienta.
    createdAt: datetime
    updatedAt: datetime
