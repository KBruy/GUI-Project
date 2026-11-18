"""Testy repozytorium assetów (src/db/repositories/assets.py) na prawdziwym PostgreSQL.

Adres bazy bierzemy z ustawień aplikacji (load_settings), tak jak test_migrations.py.
Testy działają na osobnej bazie <nazwa>_test_assets, tworzonej migracją od nowa i usuwanej
na końcu, więc nie ruszają bazy deweloperskiej. Bez działającej bazy są pomijane (skip).
Każdy test dostaje sesję w transakcji, którą na końcu wycofujemy (rollback),
więc testy nie widzą swoich danych nawzajem.
"""

from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import URL, Engine, create_engine, event, make_url, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from src.config import load_settings
from src.db.models import Asset, AssetCategory
from src.db.repositories.assets import (
    asset_exists,
    get_asset,
    list_assets,
    list_categories,
)

ALEMBIC_INI = Path(__file__).resolve().parent.parent / "alembic.ini"


@pytest.fixture(scope="module")
def engine() -> Iterator[Engine]:
    """Tworzy pustą bazę testową, zakłada tabele migracją i usuwa bazę po testach z tego pliku."""
    base_url = make_url(load_settings().database_url)
    test_url = base_url.set(database=f"{base_url.database}_test_assets")
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


@pytest.fixture
def sample_data(db: Session) -> None:
    """Wstawia znane dane testowe.

    Kategorie trees i bushes mają ten sam sort_order, żeby sprawdzić,
    że remis rozstrzyga drugi klucz sortowania.
    """
    db.add_all(
        [
            _category(1, "trees", "map", sort_order=10),
            _category(2, "rocks", "map", sort_order=20),
            _category(3, "bushes", "map", sort_order=10),
            _category(4, "hair", "character", sort_order=10),
            _category(5, "eyes", "character", sort_order=20),
        ]
    )
    db.flush()  # kategorie muszą być w bazie przed assetami (klucz obcy)

    db.add_all(
        [
            _asset("map_tree_pine_01", category_id=1),
            _asset("map_tree_oak_01", category_id=1),
            _asset("map_rock_01", category_id=2),
            _asset("map_bush_01", category_id=3),
            _asset("char_hair_short", category_id=4),
            _asset("char_eyes_blue", category_id=5),
        ]
    )
    db.flush()
    # Czyścimy pamięć sesji, żeby testy naprawdę czytały z bazy,
    # a nie dostawały obiektów, które przed chwilą same wstawiły.
    db.expunge_all()


def _category(category_id: int, key: str, module: str, sort_order: int) -> AssetCategory:
    return AssetCategory(
        id=category_id,
        key=key,
        module=module,
        name_key=f"category.{key}",
        sort_order=sort_order,
    )


def _asset(asset_id: str, category_id: int) -> Asset:
    return Asset(
        id=asset_id,
        category_id=category_id,
        name_key=f"asset.{asset_id}",
        file_path=f"{asset_id}.png",
        width=64,
        height=64,
    )


def _ids(assets: list[Asset]) -> list[str]:
    return [asset.id for asset in assets]


# --- get_asset ---


@pytest.mark.usefixtures("sample_data")
def test_get_asset_returns_existing_asset(db: Session) -> None:
    asset = get_asset(db, "map_tree_oak_01")

    assert asset is not None
    assert asset.id == "map_tree_oak_01"


@pytest.mark.usefixtures("sample_data")
def test_get_asset_returns_none_for_missing_id(db: Session) -> None:
    assert get_asset(db, "nie_ma_takiego") is None


# --- list_categories ---


@pytest.mark.usefixtures("sample_data")
def test_list_categories_returns_only_module_sorted(db: Session) -> None:
    categories = list_categories(db, "map")

    # trees i bushes mają sort_order 10, więc o kolejności decyduje id (1 przed 3).
    assert [category.key for category in categories] == ["trees", "bushes", "rocks"]


@pytest.mark.usefixtures("sample_data")
def test_list_categories_unknown_module_returns_empty_list(db: Session) -> None:
    assert list(list_categories(db, "cokolwiek")) == []


# --- list_assets ---


@pytest.mark.usefixtures("sample_data")
def test_list_assets_without_filters_returns_all_sorted(db: Session) -> None:
    assets = list_assets(db)

    assert _ids(assets) == [
        # najpierw moduł character (alfabetycznie przed map): hair (10), eyes (20)
        "char_hair_short",
        "char_eyes_blue",
        # potem map: trees (10, id 1), bushes (10, id 3), rocks (20)
        "map_tree_oak_01",
        "map_tree_pine_01",
        "map_bush_01",
        "map_rock_01",
    ]


@pytest.mark.usefixtures("sample_data")
def test_list_assets_filters_by_module(db: Session) -> None:
    assets = list_assets(db, module="map")

    # trees i bushes mają sort_order 10, więc o kolejności decyduje id kategorii (1 przed 3).
    assert _ids(assets) == ["map_tree_oak_01", "map_tree_pine_01", "map_bush_01", "map_rock_01"]


@pytest.mark.usefixtures("sample_data")
def test_list_assets_filters_by_module_and_category(db: Session) -> None:
    """Kryterium z zadania: module=map&category=trees zwraca tylko drzewa."""
    assets = list_assets(db, module="map", category="trees")

    assert _ids(assets) == ["map_tree_oak_01", "map_tree_pine_01"]


@pytest.mark.usefixtures("sample_data")
def test_list_assets_filters_by_category_only(db: Session) -> None:
    assets = list_assets(db, category="trees")

    assert _ids(assets) == ["map_tree_oak_01", "map_tree_pine_01"]


@pytest.mark.usefixtures("sample_data")
def test_list_assets_category_from_other_module_returns_empty_list(db: Session) -> None:
    assert list(list_assets(db, module="character", category="trees")) == []


@pytest.mark.usefixtures("sample_data")
def test_list_assets_unknown_category_returns_empty_list(db: Session) -> None:
    assert list(list_assets(db, category="cokolwiek")) == []


@pytest.mark.usefixtures("sample_data")
def test_list_assets_loads_category_in_single_query(db: Session) -> None:
    """Odczyt asset.category nie może wysyłać dodatkowych zapytań (problem N+1)."""
    statements: list[str] = []

    def count_query(conn, cursor, statement, parameters, context, executemany) -> None:
        statements.append(statement)

    engine = db.get_bind().engine
    event.listen(engine, "before_cursor_execute", count_query)
    try:
        assets = list_assets(db, module="map")
        keys = [asset.category.key for asset in assets]
    finally:
        event.remove(engine, "before_cursor_execute", count_query)

    assert keys == ["trees", "trees", "bushes", "rocks"]
    assert len(statements) == 1


@pytest.mark.usefixtures("sample_data")
def test_list_assets_category_available_after_session_cleared(db: Session) -> None:
    """Kategoria jest w obiekcie także po odłączeniu go od sesji."""
    assets = list_assets(db, module="map", category="trees")
    db.expunge_all()  # jak po zamknięciu sesji: obiekty nie mogą już nic dociągnąć

    assert [asset.category.module for asset in assets] == ["map", "map"]


# --- asset_exists ---


@pytest.mark.usefixtures("sample_data")
def test_asset_exists_true_for_matching_module(db: Session) -> None:
    assert asset_exists(db, "map_tree_oak_01", "map") is True


@pytest.mark.usefixtures("sample_data")
def test_asset_exists_false_for_other_module(db: Session) -> None:
    """Reguła 5.5: asset postaci nie pasuje do sceny mapy."""
    assert asset_exists(db, "char_hair_short", "map") is False


@pytest.mark.usefixtures("sample_data")
def test_asset_exists_false_for_missing_id(db: Session) -> None:
    assert asset_exists(db, "nie_ma_takiego", "map") is False