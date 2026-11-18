"""Testy repozytorium projektów (src/db/repositories/projects.py) na prawdziwym PostgreSQL.

Adres bazy bierzemy z ustawień aplikacji (load_settings), tak jak test_migrations.py.
Testy działają na osobnej bazie <nazwa>_test_projects, tworzonej migracją od nowa i usuwanej
na końcu, więc nie ruszają bazy deweloperskiej. Bez działającej bazy są pomijane (skip).
Każdy test dostaje sesję w transakcji, którą na końcu wycofujemy (rollback),
więc testy nie widzą swoich danych nawzajem.
"""

import uuid
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import URL, Engine, create_engine, event, make_url, text
from sqlalchemy.exc import IntegrityError, InvalidRequestError, OperationalError
from sqlalchemy.orm import Session

from src.config import load_settings
from src.db.repositories.projects import (
    create_project,
    delete_project,
    get_project,
    list_projects,
    update_project,
)
from src.schemas.scene import Scene

ALEMBIC_INI = Path(__file__).resolve().parent.parent / "alembic.ini"


@pytest.fixture(scope="module")
def engine() -> Iterator[Engine]:
    """Tworzy pustą bazę testową, zakłada tabele migracją i usuwa bazę po testach z tego pliku."""
    base_url = make_url(load_settings().database_url)
    test_url = base_url.set(database=f"{base_url.database}_test_projects")
    # CREATE/DROP DATABASE nie działa w transakcji, stąd AUTOCOMMIT.
    admin = create_engine(base_url, isolation_level="AUTOCOMMIT")
    try:
        with admin.connect() as connection:
            connection.execute(text(f'DROP DATABASE IF EXISTS "{test_url.database}"'))
            connection.execute(text(f'CREATE DATABASE "{test_url.database}"'))
    except OperationalError:
        admin.dispose()
        pytest.skip("Baza nie działa, uruchom: docker compose up -d")

    command.upgrade(_alembic_config(test_url), "head")
    engine = create_engine(test_url)
    yield engine

    engine.dispose()
    with admin.connect() as connection:
        connection.execute(text(f'DROP DATABASE IF EXISTS "{test_url.database}" WITH (FORCE)'))
    admin.dispose()


def _alembic_config(url: URL) -> Config:
    """Konfiguracja Alembica wskazująca na bazę testową zamiast DATABASE_URL."""
    config = Config(str(ALEMBIC_INI))
    # ConfigParser traktuje % jako początek zmiennej, więc % w haśle trzeba podwoić.
    config.set_main_option("sqlalchemy.url", url.render_as_string(hide_password=False).replace("%", "%%"))
    return config


@pytest.fixture
def db(engine: Engine) -> Iterator[Session]:
    """Sesja w transakcji, wycofywanej po teście."""
    connection = engine.connect()
    transaction = connection.begin()
    # create_savepoint: commit() w testowanym kodzie nie zatwierdzi zewnętrznej transakcji.
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    yield session
    session.close()
    transaction.rollback()
    connection.close()


def _scene(
    name: str = "Mapa",
    scene_type: str = "map",
    updated_at: str = "2026-11-01T12:00:00Z",
    scene_id: str | None = None,
) -> Scene:
    """Poprawna scena z id i datami, tak jak przygotowuje ją serwis przed zapisem."""
    return Scene.model_validate(
        {
            "schemaVersion": 1,
            "id": scene_id or str(uuid.uuid4()),
            "type": scene_type,
            "name": name,
            "width": 1024,
            "height": 768,
            "gridSize": 32,
            "background": {"color": "#000000"},
            "layers": [],
            "createdAt": "2026-11-01T12:00:00Z",
            "updatedAt": updated_at,
        }
    )


# --- create_project ---


def test_create_project_copies_scene_fields_to_columns(db: Session) -> None:
    scene = _scene(name="Wyspa")

    project = create_project(db, scene)

    assert str(project.id) == scene.id
    assert project.type == "map"
    assert project.name == "Wyspa"
    assert project.schema_version == 1
    assert project.created_at == scene.createdAt
    assert project.updated_at == scene.updatedAt


def test_create_project_stores_scene_that_reads_back_unchanged(db: Session) -> None:
    """Scena w JSONB musi dać się wczytać z powrotem jako ta sama Scene (daty jako tekst ISO)."""
    scene = _scene()
    create_project(db, scene)
    db.expunge_all()  # czytamy z bazy, nie z pamięci sesji

    stored = get_project(db, scene.id)

    assert stored is not None
    assert Scene.model_validate(stored.scene) == scene


def test_create_project_with_taken_id_raises(db: Session) -> None:
    """Repozytorium nie ukrywa błędu bazy; decyzję zostawia serwisowi."""
    scene = _scene()
    create_project(db, scene)
    db.expunge_all()

    with pytest.raises(IntegrityError):
        create_project(db, _scene(scene_id=scene.id))


# --- get_project ---


def test_get_project_returns_none_for_missing_id(db: Session) -> None:
    assert get_project(db, str(uuid.uuid4())) is None


def test_get_project_returns_none_for_invalid_uuid(db: Session) -> None:
    assert get_project(db, "abc") is None


# --- list_projects ---


def test_list_projects_newest_first(db: Session) -> None:
    create_project(db, _scene(name="A", updated_at="2026-11-01T12:00:00Z"))
    create_project(db, _scene(name="B", scene_type="character", updated_at="2026-11-02T12:00:00Z"))
    create_project(db, _scene(name="C", updated_at="2026-11-03T12:00:00Z"))

    assert [project.name for project in list_projects(db)] == ["C", "B", "A"]


def test_list_projects_same_updated_at_sorted_by_id(db: Session) -> None:
    ids = sorted(uuid.uuid4() for _ in range(3))
    # Wstawiamy w odwrotnej kolejności, żeby wynik nie zgadzał się przypadkiem z kolejnością wstawiania.
    for project_id in reversed(ids):
        create_project(db, _scene(scene_id=str(project_id)))

    assert [project.id for project in list_projects(db)] == ids


def test_list_projects_filters_by_type(db: Session) -> None:
    create_project(db, _scene(name="Mapa"))
    create_project(db, _scene(name="Postać", scene_type="character"))

    assert [project.name for project in list_projects(db, "map")] == ["Mapa"]


def test_list_projects_empty_returns_empty_list(db: Session) -> None:
    assert list(list_projects(db)) == []


def test_list_projects_does_not_select_scene_column(db: Session) -> None:
    """Kryterium z zadania: lista projektów nie pobiera kolumny scene."""
    create_project(db, _scene())
    db.expunge_all()
    statements: list[str] = []

    def remember_query(conn, cursor, statement, parameters, context, executemany) -> None:
        statements.append(statement)

    engine = db.get_bind().engine
    event.listen(engine, "before_cursor_execute", remember_query)
    try:
        projects = list_projects(db)
    finally:
        event.remove(engine, "before_cursor_execute", remember_query)

    assert len(projects) == 1
    assert len(statements) == 1
    selected_columns = statements[0].split("FROM")[0]
    assert "projects.scene" not in selected_columns


def test_list_projects_scene_access_raises(db: Session) -> None:
    """Dotknięcie scene na liście ma się wywalić, a nie po cichu dociągać scenę z bazy."""
    create_project(db, _scene())
    db.expunge_all()

    project = list_projects(db)[0]

    with pytest.raises(InvalidRequestError):
        _ = project.scene


# --- update_project ---


def test_update_project_replaces_scene_name_and_updated_at(db: Session) -> None:
    """Kryterium z zadania: po zapisie updated_at jest późniejsze niż przed zapisem."""
    original = _scene(name="Stara", updated_at="2026-11-01T12:00:00Z")
    create_project(db, original)
    db.expunge_all()
    before = get_project(db, original.id).updated_at

    changed = _scene(name="Nowa", updated_at="2026-11-05T12:00:00Z", scene_id=original.id)
    update_project(db, original.id, changed)
    db.expunge_all()
    stored = get_project(db, original.id)

    assert stored is not None
    assert stored.updated_at > before
    assert stored.name == "Nowa"
    assert Scene.model_validate(stored.scene) == changed
    assert stored.created_at == original.createdAt
    assert stored.type == "map"


def test_update_project_moves_project_to_top_of_list(db: Session) -> None:
    first = _scene(name="Pierwsza", updated_at="2026-11-01T12:00:00Z")
    create_project(db, first)
    create_project(db, _scene(name="Druga", updated_at="2026-11-02T12:00:00Z"))

    update_project(db, first.id, _scene(name="Pierwsza", updated_at="2026-11-03T12:00:00Z", scene_id=first.id))

    assert [project.name for project in list_projects(db)] == ["Pierwsza", "Druga"]


def test_update_project_returns_none_for_missing_id(db: Session) -> None:
    assert update_project(db, str(uuid.uuid4()), _scene()) is None


# --- delete_project ---


def test_delete_project_removes_existing(db: Session) -> None:
    scene = _scene()
    create_project(db, scene)

    assert delete_project(db, scene.id) is True
    assert get_project(db, scene.id) is None


def test_delete_project_returns_false_when_already_deleted(db: Session) -> None:
    scene = _scene()
    create_project(db, scene)
    delete_project(db, scene.id)

    assert delete_project(db, scene.id) is False


def test_delete_project_returns_false_for_invalid_uuid(db: Session) -> None:
    assert delete_project(db, "abc") is False
