"""[B-01 - szkielet] Endpoint /api/health: sprawdzenie, czy serwer działa (wskaźnik w stopce frontendu)."""

from fastapi import APIRouter

# APIRouter grupuje endpointy jednego tematu; main.py dołącza go do aplikacji.
router = APIRouter()


# Dekorator rejestruje funkcję jako obsługę GET; zwrócony słownik trafia do odpowiedzi jako JSON (200).
@router.get("/api/health")
def health() -> dict[str, bool]:
    return {"ok": True}
