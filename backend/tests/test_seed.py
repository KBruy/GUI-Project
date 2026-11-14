"""Testy skryptu seed (src/db/seed.py).

Testy extract_categories i main nie potrzebują bazy. Testy seed działają na bazie <nazwa>_test
z conftest.py, a każdy test ma własną transakcję cofaną na końcu, więc zaczyna od pustych tabel.
"""

from pathlib import Path

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.config import Settings
from src.db import seed as seed_module
from src.db.models import Asset as AssetRow
from src.db.models import AssetCategory
from src.db.seed import extract_categories, seed
from src.dev.memory_repos import load_manifest
from src.schemas.asset import Asset


def make_asset(**overrides) -> Asset:
    """Poprawny asset mapy; overrides podmienia wybrane pola."""
    values = {
        "id": "map_tree_oak_01",
        "module": "map",
        "category": "trees",
        "nameKey": "assets.map.tree_oak",
        "file": "map/trees/map_tree_oak_01.png",
        "width": 64,
        "height": 96,
    }
    return Asset(**(values | overrides))


def category_ids(session: Session) -> dict[str, int]:
    """Stan tabeli asset_categories jako key -> id."""
    return dict(session.execute(select(AssetCategory.key, AssetCategory.id)).all())


def stored_assets(session: Session) -> dict[str, tuple]:
    """Stan tabeli assets jako id -> (kategoria, name_key, file_path, width, height)."""
    rows = session.execute(
        select(AssetRow.id, AssetCategory.key, AssetRow.name_key, AssetRow.file_path, AssetRow.width, AssetRow.height)
        .join(AssetCategory, AssetRow.category_id == AssetCategory.id)
    ).all()
    return {row[0]: tuple(row[1:]) for row in rows}


# --- extract_categories (bez bazy) ---


def test_extract_categories_from_manifest(assets_manifest: Path):
    assert extract_categories(load_manifest(assets_manifest)) == [
        {"key": "hair", "module": "character", "name_key": "categories.character.hair", "sort_order": 0},
        {"key": "rocks", "module": "map", "name_key": "categories.map.rocks", "sort_order": 1},
        {"key": "trees", "module": "map", "name_key": "categories.map.trees", "sort_order": 2},
    ]


def test_extract_categories_merges_assets_of_one_category():
    assets = [make_asset(), make_asset(id="map_tree_pine_01")]
    assert [row["key"] for row in extract_categories(assets)] == ["trees"]


def test_extract_categories_order_does_not_depend_on_manifest_order():
    assets = [make_asset(category="trees"), make_asset(id="map_rock_01", category="rocks")]
    assert extract_categories(assets) == extract_categories(list(reversed(assets)))


def test_extract_categories_rejects_category_in_two_modules():
    assets = [make_asset(), make_asset(id="char_tree_01", module="character")]
    # Komunikat ma wskazać kategorię i asset, który wywołał konflikt.
    with pytest.raises(ValueError, match="trees.*char_tree_01"):
        extract_categories(assets)


def test_extract_categories_of_empty_list():
    assert extract_categories([]) == []


# --- seed (baza testowa) ---


def test_seed_inserts_categories_and_assets(session: Session, assets_manifest: Path):
    assert seed(session, load_manifest(assets_manifest)) == (3, 3)

    assert set(category_ids(session)) == {"hair", "rocks", "trees"}
    # Każdy asset trafił do właściwej kategorii, z polami przepisanymi z manifestu.
    assert stored_assets(session) == {
        "map_tree_oak_01": ("trees", "assets.map.tree_oak", "map/trees/map_tree_oak_01.png", 64, 96),
        "map_rock_01": ("rocks", "assets.map.rock", "map/rocks/map_rock_01.png", 32, 32),
        "char_hair_short_01": ("hair", "assets.character.hair_short", "character/hair/char_hair_short_01.png", 256, 512),
    }


def test_seed_twice_changes_nothing(session: Session, assets_manifest: Path):
    assets = load_manifest(assets_manifest)
    seed(session, assets)
    ids_before, assets_before = category_ids(session), stored_assets(session)

    seed(session, assets)

    # Te same wiersze i te same id kategorii: assety dalej wskazują na właściwe kategorie.
    assert category_ids(session) == ids_before
    assert stored_assets(session) == assets_before


def test_seed_updates_changed_asset(session: Session):
    seed(session, [make_asset()])
    ids_before = category_ids(session)

    seed(session, [make_asset(width=80, nameKey="assets.map.tree_oak_big")])

    assert stored_assets(session)["map_tree_oak_01"][1:] == ("assets.map.tree_oak_big", "map/trees/map_tree_oak_01.png", 80, 96)
    assert category_ids(session) == ids_before


def test_seed_moves_asset_to_another_category(session: Session):
    seed(session, [make_asset()])
    seed(session, [make_asset(category="bushes")])
    assert stored_assets(session)["map_tree_oak_01"][0] == "bushes"


def test_seed_new_category_keeps_existing_ids(session: Session):
    seed(session, [make_asset(category="trees")])
    trees_id = category_ids(session)["trees"]

    # "rocks" jest przed "trees" alfabetycznie, więc sort_order drzew się zmieni, ale id nie.
    seed(session, [make_asset(category="trees"), make_asset(id="map_rock_01", category="rocks")])

    assert category_ids(session)["trees"] == trees_id
    sort_orders = dict(session.execute(select(AssetCategory.key, AssetCategory.sort_order)).all())
    assert sort_orders == {"rocks": 0, "trees": 1}


def test_seed_does_not_delete_assets_missing_from_manifest(session: Session):
    # Obecne zachowanie: seed tylko dodaje i aktualizuje. Usuwanie to otwarta decyzja zespołu.
    seed(session, [make_asset(), make_asset(id="map_tree_pine_01")])
    seed(session, [make_asset()])
    assert set(stored_assets(session)) == {"map_tree_oak_01", "map_tree_pine_01"}


def test_seed_is_all_or_nothing(session: Session):
    # width=0 przechodzi przez Pydantic, ale baza go odrzuca (CHECK), już po wstawieniu kategorii.
    assets = [make_asset(), make_asset(id="map_bush_01", category="bushes", width=0)]
    with pytest.raises(IntegrityError, match="ck_assets_size_positive"):
        # Tak jak w main(): cały seed w jednej transakcji (tu savepoint w transakcji testu).
        with session.begin():
            seed(session, assets)

    assert category_ids(session) == {}
    assert stored_assets(session) == {}


def test_seed_of_empty_list_does_nothing(session: Session):
    assert seed(session, []) == (0, 0)
    assert category_ids(session) == {}


# --- main (bez bazy: kończy się przed otwarciem sesji) ---


def use_manifest(monkeypatch: pytest.MonkeyPatch, path: Path) -> None:
    """Podmienia ustawienia widziane przez seed, żeby main() czytał manifest z podanej ścieżki."""
    monkeypatch.setattr(seed_module, "load_settings", lambda: Settings(client_origins=[], assets_manifest=path))


def test_main_without_manifest_file(monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture):
    use_manifest(monkeypatch, tmp_path / "manifest.json")
    seed_module.main()
    assert "Brak pliku manifestu" in capsys.readouterr().out


def test_main_with_empty_manifest(monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture):
    manifest = tmp_path / "manifest.json"
    manifest.write_text("[]", encoding="utf-8")
    use_manifest(monkeypatch, manifest)
    seed_module.main()
    assert "jest pusty" in capsys.readouterr().out
