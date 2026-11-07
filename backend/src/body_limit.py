"""Limit rozmiaru ciała zapytania: za duże zapytanie jest odrzucane, zanim serwer zacznie je czytać."""

from fastapi import Request, Response
from fastapi.responses import JSONResponse

from src.config import MAX_BODY_BYTES
from src.errors import error_body


async def reject_large_bodies(request: Request, call_next) -> Response:
    """Zapytanie z nagłówkiem Content-Length większym niż MAX_BODY_BYTES → 413 INVALID_FILE."""
    # Content-Length to rozmiar ciała w bajtach; przeglądarka wysyła go przy każdym zapytaniu z treścią.
    content_length = request.headers.get("content-length", "")
    if content_length.isdigit() and int(content_length) > MAX_BODY_BYTES:
        # 413 Content Too Large: standardowy status HTTP dla za dużego ciała zapytania.
        return JSONResponse(status_code=413, content=error_body("INVALID_FILE"))
    return await call_next(request)
