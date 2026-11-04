"""Model assetu: wpis z assets/manifest.json."""

from src.schemas.base import ContractModel, Module


class Asset(ContractModel):
    """Grafika z biblioteki, np. drzewo na mapę albo koszulka dla postaci."""

    # Identyfikator tekstowy, np. "map_tree_oak_01".
    id: str
    module: Module
    category: str
    # Klucz tłumaczenia nazwy, np. "assets.map.tree_oak"; tekst wyświetla frontend.
    nameKey: str
    # Ścieżka PNG względem folderu assetów, np. "map/trees/map_tree_oak_01.png".
    file: str
    width: int
    height: int
