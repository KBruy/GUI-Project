"""Testy limitu rozmiaru ciała zapytania (MAX_BODY_BYTES)."""

import pytest
from fastapi.testclient import TestClient

from src.config import MAX_BODY_BYTES, Settings
from src.main import create_app

FRONTEND = "http://localhost:5173"


@pytest.fixture
def client() -> TestClient:
    return TestClient(create_app(Settings(client_origins=[FRONTEND])))


def post_body(client: TestClient, size: int):
    """Wysyła do POST /api/projects ciało o podanym rozmiarze w bajtach (niepoprawny JSON)."""
    return client.post(
        "/api/projects",
        # Każde "x" to 1 bajt, więc size = rozmiar ciała w bajtach; content= wysyła bajty bez zmian.
        content=b"x" * size,
        headers={"Content-Type": "application/json", "Origin": FRONTEND},
    )


def test_body_over_limit_returns_invalid_file(client):
    response = post_body(client, MAX_BODY_BYTES + 1)

    assert response.status_code == 413
    assert response.json() == {"error": {"code": "INVALID_FILE", "messageKey": "errors.invalidFile", "details": {}}}


def test_body_over_limit_has_cors_header(client):
    response = post_body(client, MAX_BODY_BYTES + 1)

    # Bez nagłówka CORS przeglądarka ukryłaby odpowiedź i frontend pokazałby tylko błąd sieci.
    assert response.headers["access-control-allow-origin"] == FRONTEND


def test_body_at_limit_reaches_endpoint(client):
    response = post_body(client, MAX_BODY_BYTES)

    # Ciało przechodzi przez limit; endpoint odrzuca je dopiero jako zły JSON.
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_FAILED"
