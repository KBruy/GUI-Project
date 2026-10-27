"""[B-02 - modele i błędy] Modele sceny: Scene, Layer, SceneObject (rozdz. 5.2 dokumentu technicznego).

Modele sprawdzają tylko pola i ich typy. Reguły (limit warstw, zakres skali, granice sceny itd.)
sprawdza services/validation.py.
"""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import Field

from src.schemas.base import ContractModel

# Literal dopuszcza tylko wymienione wartości; inna wartość to błąd walidacji.
SceneType = Literal["map", "character"]

# Data jako napis ISO 8601, np. "2026-10-26T12:00:00Z".
# strict=False jest potrzebne, bo w trybie ścisłym Pydantic nie zamieniłby napisu na datę.
IsoDateTime = Annotated[datetime, Field(strict=False)]


class SceneObject(ContractModel):
    """Obiekt na scenie: odwołanie do assetu z biblioteki wraz z położeniem i przekształceniem."""

    id: str
    assetId: str
    # Środek obiektu w pikselach sceny; (0, 0) to lewy górny róg, Y rośnie w dół.
    x: float
    y: float
    # Rozmiar bazowy z assetu; skalowanie tylko przez scaleX/scaleY.
    width: int
    height: int
    # Stopnie, zgodnie z ruchem wskazówek zegara.
    rotation: float
    scaleX: float
    scaleY: float


class Layer(ContractModel):
    """Warstwa sceny; obiekty z listy są rysowane w kolejności od pierwszego do ostatniego."""

    id: str
    name: str
    visible: bool
    locked: bool
    objects: list[SceneObject]


class Background(ContractModel):
    # Kolor w formacie "#rrggbb", np. "#7ec850".
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")


class Scene(ContractModel):
    """Cała scena (mapa lub postać); ten sam obiekt trafia do bazy i do pliku eksportu."""

    # Dowolna liczba całkowita; wersję inną niż 1 zgłasza walidacja reguł (UNSUPPORTED_SCHEMA_VERSION).
    schemaVersion: int
    id: str
    type: SceneType
    name: str
    width: int
    height: int
    gridSize: Literal[32]
    background: Background
    # Indeks 0 to najniższa warstwa.
    layers: list[Layer]
    createdAt: IsoDateTime
    updatedAt: IsoDateTime
