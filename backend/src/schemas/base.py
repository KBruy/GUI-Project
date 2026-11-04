"""Wspólna klasa bazowa modeli kontraktu danych i typy używane w kilku modelach."""

from typing import Literal

from pydantic import BaseModel, ConfigDict

# Literal dopuszcza tylko wymienione wartości; inna wartość to błąd walidacji.
# Moduł edytora: typ sceny, moduł assetu i filtr listy assetów.
Module = Literal["map", "character"]


class ContractModel(BaseModel):
    """Model o ścisłych typach. Nazwy pól są w camelCase, tak samo jak klucze w JSON-ie sceny."""

    # strict=True: typy nie są zamieniane ("5" nie stanie się liczbą 5, a 1 nie stanie się true).
    # extra="forbid": nieznane pole to błąd.
    # allow_inf_nan=False: odrzuca NaN i Infinity, które Python przyjmuje w JSON-ie jako liczby.
    model_config = ConfigDict(strict=True, extra="forbid", allow_inf_nan=False)
