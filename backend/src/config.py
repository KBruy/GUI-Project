"""Ustawienia backendu w jednym miejscu.

Wartości pochodzą ze zmiennych środowiskowych, a przy ich braku z ustawień domyślnych do pracy lokalnej.
Plik .env nie jest wczytywany automatycznie: tylko gdy Uvicorn działa z flagą --env-file .env.
Reszta kodu nie czyta os.environ, tylko korzysta z obiektu Settings.
"""

import os
from dataclasses import dataclass

# Domyślny adres serwera deweloperskiego Vite.
DEFAULT_CLIENT_ORIGIN = "http://localhost:5173"
DEFAULT_DATABASE_URL = "postgresql+psycopg://worldsmith:worldsmith@localhost:5432/worldsmith"


# @dataclass generuje konstruktor z pól klasy; frozen=True blokuje zmianę ustawień po utworzeniu.
@dataclass(frozen=True)
class Settings:
    client_origins: list[str]
    database_url: str = DEFAULT_DATABASE_URL


def parse_origins(raw: str) -> list[str]:
    """Zamienia napis "a, b,c" na listę ["a", "b", "c"], pomijając puste fragmenty."""
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def load_settings() -> Settings:
    """Czyta zmienne środowiskowe i buduje z nich Settings."""
    return Settings(
        client_origins=parse_origins(os.getenv("CLIENT_ORIGIN", DEFAULT_CLIENT_ORIGIN)),
        database_url=os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL),
    )
