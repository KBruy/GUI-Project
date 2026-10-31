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

# Stałe reguł poprawności sceny (rozdz. 5.5); używa ich services/validation.py.
SUPPORTED_SCHEMA_VERSION = 1
MAX_LAYERS = 10
# Dozwolone rozmiary płótna (szerokość, wysokość) dla każdego typu sceny.
ALLOWED_SCENE_SIZES: dict[str, set[tuple[int, int]]] = {
    "map": {(640, 480), (1280, 960), (2048, 1536)},
    "character": {(256, 512)},
}
# Zakresy skali i obrotu obiektu (rozdz. 5.1 i 5.5); wartości na granicach są dozwolone.
MIN_SCALE = 0.1
MAX_SCALE = 10
MIN_ROTATION = 0
MAX_ROTATION = 360


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
