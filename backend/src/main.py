"""[B-01 - szkielet] Punkt startowy backendu: tworzy aplikację FastAPI, dołącza routery i handlery błędów.

Uruchomienie (z folderu backend/):
    uvicorn src.main:app --reload --port 8000 --env-file .env
"src.main:app" oznacza zmienną app z pliku src/main.py.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import health
from src.config import Settings, load_settings
# [B-02 - modele i błędy] Handlery błędów.
from src.error_handlers import register_error_handlers


# [B-01 - szkielet] Budowa aplikacji.
def create_app(settings: Settings | None = None) -> FastAPI:
    """Buduje aplikację; testy mogą podać własne Settings, by sprawdzić inną konfigurację."""
    if settings is None:
        settings = load_settings()

    app = FastAPI(title="WorldSmith API")

    # [B-02 - modele i błędy] Handlery błędów przed CORS: middleware dodane później obejmuje wcześniejsze,
    # więc CORS dopisuje swoje nagłówki także do odpowiedzi 500.
    register_error_handlers(app)

    # [B-01 - szkielet] CORS: przeglądarka blokuje zapytania z innego adresu (frontend :5173, backend :8000).
    # Middleware działa przy każdym zapytaniu i dopisuje nagłówki zezwalające adresom z listy.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.client_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # [B-01 - szkielet] include_router dołącza endpointy zdefiniowane w osobnym pliku (jeden plik na temat).
    app.include_router(health.router)
    return app


# [B-01 - szkielet] Zmienna do odpalenia aplikacji przez Uvicorn
app = create_app()
