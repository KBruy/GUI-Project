"""Wspólne dane testowe; pytest automatycznie udostępnia fixture z tego pliku wszystkim testom."""

from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import URL, Engine, create_engine, make_url, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from src.config import load_settings

ALEMBIC_INI = Path(__file__).resolve().parent.parent / "alembic.ini"


@pytest.fixture
def scene_data() -> dict:
    """Zwraca poprawną scenę-mapę w formacie JSON kontraktu (świeża kopia dla każdego testu)."""
    return {
        "schemaVersion": 1,
        "id": "3f2b8c1e-5d4a-4f6b-9a7c-1e2d3c4b5a69",
        "type": "map",
        "name": "Wioska",
        "width": 1280,
        "height": 960,
        "gridSize": 32,
        "background": {"color": "#7ec850"},
        "layers": [
            {
                "id": "l1",
                "name": "Teren",
                "visible": True,
                "locked": False,
                "objects": [
                    {
                        "id": "o1",
                        "assetId": "map_tree_oak_01",
                        "x": 100,
                        "y": 200.5,
                        "width": 64,
                        "height": 96,
                        "rotation": 0,
                        "scaleX": 1,
                        "scaleY": 1.5,
                    }
                ],
            }
        ],
        "createdAt": "2026-10-26T12:00:00Z",
        "updatedAt": "2026-10-26T12:00:00Z",
    }


@pytest.fixture
def assets_manifest() -> Path:
    """Zwraca ścieżkę do małego manifestu testowego (2 assety mapy, 1 postaci), niezależnego od assets/."""
    return Path(__file__).parent / "assets_manifest.json"


# Fixture bazy testowej, wspólne dla testów migracji i seeda.
# scope="module": każdy plik testów dostaje własną, świeżą bazę <nazwa>_test.


@pytest.fixture(scope="module")
def test_db_url() -> Iterator[URL]:
    """Tworzy pustą bazę <nazwa>_test obok bazy z ustawień i usuwa ją po testach z danego pliku."""
    base_url = make_url(load_settings().database_url)
    test_url = base_url.set(database=f"{base_url.database}_test")
    # CREATE/DROP DATABASE nie działa w transakcji, stąd AUTOCOMMIT.
    admin = create_engine(base_url, isolation_level="AUTOCOMMIT")
    try:
        with admin.connect() as connection:
            connection.execute(text(f'DROP DATABASE IF EXISTS "{test_url.database}"'))
            connection.execute(text(f'CREATE DATABASE "{test_url.database}"'))
    except OperationalError:
        admin.dispose()
        pytest.skip("Baza nie działa, uruchom: docker compose up -d")
    yield test_url
    with admin.connect() as connection:
        connection.execute(text(f'DROP DATABASE IF EXISTS "{test_url.database}" WITH (FORCE)'))
    admin.dispose()


@pytest.fixture(scope="module")
def alembic_cfg(test_db_url: URL) -> Config:
    """Konfiguracja Alembica wskazująca na bazę testową zamiast DATABASE_URL."""
    config = Config(str(ALEMBIC_INI))
    # ConfigParser traktuje % jako początek zmiennej, więc % w haśle trzeba podwoić.
    config.set_main_option("sqlalchemy.url", test_db_url.render_as_string(hide_password=False).replace("%", "%%"))
    return config


@pytest.fixture(scope="module")
def engine(test_db_url: URL, alembic_cfg: Config) -> Iterator[Engine]:
    """Silnik bazy testowej z tabelami utworzonymi migracją (nie create_all), tak jak na produkcji."""
    command.upgrade(alembic_cfg, "head")
    engine = create_engine(test_db_url)
    yield engine
    engine.dispose()


@pytest.fixture
def session(engine: Engine) -> Iterator[Session]:
    """Sesja w transakcji cofanej po każdym teście, więc testy nie widzą swoich danych."""
    with engine.connect() as connection:
        transaction = connection.begin()
        # create_savepoint: commit/rollback w teście dotyczy savepointu, a zewnętrzna transakcja zostaje.
        with Session(bind=connection, join_transaction_mode="create_savepoint") as session:
            yield session
        transaction.rollback()
