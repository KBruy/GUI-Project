"""Testy szkieletu: /api/health, CORS i odczyt konfiguracji."""

import pytest
from fastapi.testclient import TestClient

from src.config import Settings, load_settings, parse_origins
from src.main import create_app

FRONTEND = "http://localhost:5173"


# Fixture pytest: tworzy świeżego klienta dla każdego testu.
@pytest.fixture
def client() -> TestClient:
    # TestClient wysyła zapytania prosto do aplikacji w pamięci, bez uruchamiania serwera.
    return TestClient(create_app(Settings(client_origins=[FRONTEND])))


def test_health_returns_ok(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_cors_allows_frontend_origin(client):
    response = client.get("/api/health", headers={"Origin": FRONTEND})

    assert response.headers["access-control-allow-origin"] == FRONTEND


def test_cors_blocks_unknown_origin(client):
    response = client.get("/api/health", headers={"Origin": "http://evil.example"})

    # Brak nagłówka oznacza, że przeglądarka nie pokaże odpowiedzi stronie z obcego adresu.
    assert "access-control-allow-origin" not in response.headers


def test_parse_origins_splits_and_trims():
    assert parse_origins(" http://a , http://b,, ") == ["http://a", "http://b"]


def test_load_settings_reads_env(monkeypatch):
    # monkeypatch ustawia zmienną środowiskową tylko na czas tego testu.
    monkeypatch.setenv("CLIENT_ORIGIN", "http://x,http://y")

    assert load_settings().client_origins == ["http://x", "http://y"]


def test_load_settings_uses_default_without_env(monkeypatch):
    monkeypatch.delenv("CLIENT_ORIGIN", raising=False)

    assert load_settings().client_origins == [FRONTEND]
