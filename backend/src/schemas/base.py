"""Wspólna klasa bazowa modeli kontraktu danych (rozdz. 5 dokumentu technicznego)."""

from pydantic import BaseModel, ConfigDict


class ContractModel(BaseModel):
    """Model o ścisłych typach. Nazwy pól są w camelCase, tak samo jak klucze w JSON-ie sceny."""

    # strict=True: typy nie są zamieniane ("5" nie stanie się liczbą 5, a 1 nie stanie się true).
    # extra="forbid": nieznane pole to błąd.
    # allow_inf_nan=False: odrzuca NaN i Infinity, które Python przyjmuje w JSON-ie jako liczby.
    model_config = ConfigDict(strict=True, extra="forbid", allow_inf_nan=False)
