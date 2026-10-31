"""Ustawienia backendu w jednym miejscu.

Wartości pochodzą ze zmiennych środowiskowych, a przy ich braku z ustawień domyślnych do pracy lokalnej.
Plik .env nie jest wczytywany automatycznie: tylko gdy Uvicorn działa z flagą --env-file .env.
Reszta kodu nie czyta os.environ, tylko korzysta z obiektu Settings.
"""

import os
from dataclasses import dataclass
from pathlib import Path

# Domyślny adres serwera deweloperskiego Vite.
DEFAULT_CLIENT_ORIGIN = "http://localhost:5173"
DEFAULT_DATABASE_URL = "postgresql+psycopg://worldsmith:worldsmith@localhost:5432/worldsmith"

# Ścieżki liczone od położenia tego pliku, więc nie zależą od folderu, z którego startuje serwer.
BACKEND_DIR = Path(__file__).resolve().parent.parent
# Pliki na dysku serwera; PNG assetów leżą w podfolderze assets/.
DEFAULT_STORAGE_DIR = BACKEND_DIR / "storage"
# Lista wszystkich assetów biblioteki (JSON: lista obiektów Asset).
DEFAULT_ASSETS_MANIFEST = BACKEND_DIR.parent / "assets" / "manifest.json"

# Stałe reguł poprawności sceny; używa ich services/validation.py.
SUPPORTED_SCHEMA_VERSION = 1
MAX_LAYERS = 10
# Dozwolone rozmiary płótna (szerokość, wysokość) dla każdego typu sceny.
ALLOWED_SCENE_SIZES: dict[str, set[tuple[int, int]]] = {
    "map": {(640, 480), (1280, 960), (2048, 1536)},
    "character": {(256, 512)},
}
# Zakresy skali i obrotu obiektu; wartości na granicach są dozwolone.
MIN_SCALE = 0.1
MAX_SCALE = 10
MIN_ROTATION = 0
MAX_ROTATION = 360


# @dataclass generuje konstruktor z pól klasy; frozen=True blokuje zmianę ustawień po utworzeniu.
@dataclass(frozen=True)
class Settings:
    client_origins: list[str]
    database_url: str = DEFAULT_DATABASE_URL
    storage_dir: Path = DEFAULT_STORAGE_DIR
    assets_manifest: Path = DEFAULT_ASSETS_MANIFEST


def parse_origins(raw: str) -> list[str]:
    """Zamienia napis "a, b,c" na listę ["a", "b", "c"], pomijając puste fragmenty."""
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def load_settings() -> Settings:
    """Czyta zmienne środowiskowe i buduje z nich Settings."""
    return Settings(
        client_origins=parse_origins(os.getenv("CLIENT_ORIGIN", DEFAULT_CLIENT_ORIGIN)),
        database_url=os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL),
    )
