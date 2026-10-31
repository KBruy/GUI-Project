"""Test połączenia z bazą"""

import pytest
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from src.db.session import SessionLocal


def test_database_connection():
    db = SessionLocal()
    try:
        # SELECT 1 to najprostsze zapytanie: baza zwraca liczbę 1, jeśli połączenie działa.
        result = db.execute(text("SELECT 1")).scalar()
    except OperationalError:
        pytest.skip("Baza nie działa, uruchom: docker compose up -d")
    finally:
        db.close()

    assert result == 1