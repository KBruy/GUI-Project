"""Punkt startowy backendu: tworzy aplikację FastAPI i dołącza do niej routery.

Uruchomienie (z folderu backend/):
    uvicorn src.main:app --reload --port 8000 --env-file .env
"src.main:app" oznacza zmienną app z pliku src/main.py.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import health
from src.config import Settings, load_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    """Buduje aplikację; testy mogą podać własne Settings, by sprawdzić inną konfigurację."""
    if settings is None:
        settings = load_settings()

    app = FastAPI(title="WorldSmith API")

    # CORS: przeglądarka blokuje zapytania z innego adresu (frontend :5173, backend :8000).
    # Middleware działa przy każdym zapytaniu i dopisuje nagłówki zezwalające adresom z listy.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.client_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # include_router dołącza endpointy zdefiniowane w osobnym pliku (jeden plik na temat).
    app.include_router(health.router)
    return app


# Zmienna do odpalenia aplikacji przez Uvicorn
app = create_app()
