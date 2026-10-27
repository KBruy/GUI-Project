"""Handlery błędów: zamieniają każdy błąd na odpowiedź {"error": {"code", "messageKey", "details"}}.

Dzięki nim domyślne {"detail": ...} z FastAPI nie trafia do frontendu.
"""

import logging

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.errors import AppError, Issue, error_body

logger = logging.getLogger(__name__)


def register_error_handlers(app: FastAPI) -> None:
    """Podpina handlery do aplikacji. Musi być wywołana przed dodaniem CORS (patrz main.py)."""
    # Handler wyjątku: funkcja, którą FastAPI wywołuje, gdy endpoint rzuci wyjątek danego typu.
    app.add_exception_handler(AppError, handle_app_error)
    app.add_exception_handler(RequestValidationError, handle_request_validation_error)
    # Błędy HTTP z FastAPI, np. 404 dla nieistniejącego adresu.
    app.add_exception_handler(StarletteHTTPException, handle_http_exception)
    # Pozostałe wyjątki łapie middleware, a nie handler dla Exception, bo odpowiedź
    # z takiego handlera nie dostałaby nagłówków CORS i przeglądarka by jej nie pokazała.
    app.middleware("http")(catch_unexpected_errors)


def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
    """Zwraca kod i status podane w AppError."""
    return JSONResponse(status_code=exc.status_code, content=error_body(exc.code, exc.issues))


def handle_request_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Zły kształt danych (zły typ, brak pola, nieznane pole, zły JSON) → 422 VALIDATION_FAILED.

    Każdy błąd Pydantic staje się jednym problemem INVALID_FIELD ze ścieżką do pola.
    """
    issues = [Issue.of("INVALID_FIELD", **field_of(error)) for error in exc.errors()]
    return JSONResponse(status_code=422, content=error_body("VALIDATION_FAILED", issues))


def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Błąd HTTP z FastAPI → kod błędu według statusu (status zostaje bez zmian)."""
    return JSONResponse(
        status_code=exc.status_code,
        content=error_body(code_for_status(exc.status_code)),
        # Np. nagłówek Allow przy 405 (lista dozwolonych metod).
        headers=exc.headers,
    )


def code_for_status(status_code: int) -> str:
    """Dobiera kod błędu do statusu HTTP."""
    # 404: nie ma takiego adresu, 405: adres jest, ale nie dla tej metody.
    if status_code in (404, 405):
        return "NOT_FOUND"
    # Inne 4xx: nie da się odczytać przesłanych danych (np. ciało, którego FastAPI nie umie przetworzyć).
    # Po dodaniu kont (B-11) 401 i 403 potrzebują osobnych kodów, inaczej trafią tutaj.
    if status_code < 500:
        return "INVALID_FILE"
    return "SERVER_ERROR"


async def catch_unexpected_errors(request: Request, call_next) -> Response:
    """Każdy inny wyjątek → 500 SERVER_ERROR. Szczegóły idą tylko do logów serwera."""
    try:
        # call_next przekazuje zapytanie dalej (do endpointu) i zwraca jego odpowiedź.
        return await call_next(request)
    except Exception:
        logger.exception("Nieobsłużony wyjątek: %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content=error_body("SERVER_ERROR"))


def field_of(error: dict) -> dict[str, str]:
    """Zamienia ścieżkę błędu Pydantic na napis, np. ("body", "layers", 0, "x") → {"field": "layers[0].x"}."""
    # Zły JSON nie dotyczy żadnego pola.
    if error["type"] == "json_invalid":
        return {}

    path = ""
    # Pierwszy element ("body", "query" lub "path") mówi tylko, skąd jest wartość, więc jest pomijany.
    for part in error["loc"][1:]:
        if isinstance(part, int):
            path += f"[{part}]"
        else:
            path += f".{part}" if path else str(part)
    return {"field": path} if path else {}
