"""Interfejsy repozytoriów: jedyny punkt styku kodu API z przechowywaniem danych.

Endpointy i serwisy korzystają tylko z tych interfejsów; konkretną implementację (w pamięci albo w bazie) wybiera deps.py.
"""

from typing import Protocol

from src.schemas.asset import Asset
from src.schemas.project import ProjectSummary
from src.schemas.scene import Scene


# Protocol opisuje wymagane metody; klasa pasuje do interfejsu, gdy ma te metody, nie musi po nim dziedziczyć.
class AssetRepository(Protocol):
    """Biblioteka assetów (tylko odczyt)."""

    def list_assets(self, module: str | None = None, category: str | None = None) -> list[Asset]:
        """Zwraca assety; None w filtrze oznacza brak filtrowania po tym polu.

        Kolejność jest stała: alfabetycznie po module, potem po kategorii, potem po id.
        """
        ...


class ProjectRepository(Protocol):
    """Projekty map i postaci; scena jest zapisywana i zwracana w całości.

    Repozytorium nie sprawdza reguł i nie nadaje id ani dat: robi to services/projects.py przed zapisem.
    """

    def list_projects(self, scene_type: str | None = None) -> list[ProjectSummary]:
        """Zwraca projekty bez scen, od ostatnio zmienionego (updatedAt malejąco); None oznacza wszystkie typy."""
        ...

    def get_project(self, project_id: str) -> Scene | None:
        """Zwraca scenę projektu albo None, gdy projektu o tym id nie ma."""
        ...

    def save_project(self, scene: Scene) -> None:
        """Zapisuje scenę pod jej id: tworzy nowy projekt albo nadpisuje istniejący."""
        ...

    def delete_project(self, project_id: str) -> bool:
        """Usuwa projekt; zwraca False, gdy projektu o tym id nie było."""
        ...
