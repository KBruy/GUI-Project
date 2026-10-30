"""Model assetu: wpis z assets/manifest.json (rozdz. 5.4 dokumentu technicznego)."""

from typing import Literal

from src.schemas.base import ContractModel


class Asset(ContractModel):
    """Grafika z biblioteki, np. drzewo na mapę albo koszulka dla postaci."""

    # Identyfikator tekstowy, np. "map_tree_oak_01".
    id: str
    module: Literal["map", "character"]
    category: str
    # Klucz tłumaczenia nazwy, np. "assets.map.tree_oak"; tekst wyświetla frontend.
    nameKey: str
    # Ścieżka PNG względem folderu assetów, np. "map/trees/map_tree_oak_01.png".
    file: str
    width: int
    height: int
