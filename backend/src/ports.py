"""Interfejsy repozytoriów: jedyny punkt styku kodu API z przechowywaniem danych.

Endpointy i serwisy korzystają tylko z tych interfejsów; konkretną implementację (w pamięci albo w bazie) wybiera deps.py.
"""

from typing import Protocol

from src.schemas.asset import Asset


# Protocol opisuje wymagane metody; klasa pasuje do interfejsu, gdy ma te metody, nie musi po nim dziedziczyć.
class AssetRepository(Protocol):
    """Biblioteka assetów (tylko odczyt)."""

    def list_assets(self, module: str | None = None, category: str | None = None) -> list[Asset]:
        """Zwraca assety; None w filtrze oznacza brak filtrowania po tym polu.

        Kolejność jest stała: alfabetycznie po module, potem po kategorii, potem po id.
        """
        ...
