"""Seed: wgrywa assety z assets/manifest.json do tabel asset_categories i assets.

Uruchamianie (z folderu backend/): python -m src.db.seed
Można uruchamiać wielokrotnie: istniejące wiersze są aktualizowane, a nie dublowane.
Kategorie nie są w manifeście osobno, więc seed wyciąga je z assetów:
name_key = "categories.<module>.<key>", sort_order = kolejność alfabetyczna po key, od 0.
Brak pliku i pusty manifest nie są błędem, bo prawdziwych assetów jeszcze nie ma.
TODO: gdy pojawią się prawdziwe assety, traktować brak pliku jako błąd.
"""

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from src.config import load_settings
from src.db.models import Asset as AssetRow
from src.db.models import AssetCategory
from src.db.session import SessionLocal
from src.dev.memory_repos import load_manifest
from src.schemas.asset import Asset

# Kolumny assetu nadpisywane przy ponownym seedzie; bez id (po nim wykrywamy konflikt) i created_at (data pierwszego wgrania).
ASSET_UPDATE_COLUMNS = ["category_id", "name_key", "file_path", "width", "height"]


def extract_categories(assets: list[Asset]) -> list[dict[str, str | int]]:
    """Z listy assetów wyciąga unikalne kategorie jako wiersze do tabeli asset_categories.

    Zgłasza ValueError, gdy ta sama kategoria występuje w dwóch modułach.
    """
    modules: dict[str, str] = {}
    for asset in assets:
        known = modules.get(asset.category)
        if known is None:
            modules[asset.category] = asset.module
        elif known != asset.module:
            raise ValueError(
                f"Kategoria '{asset.category}' występuje w dwóch modułach: "
                f"'{known}' i '{asset.module}' (asset '{asset.id}')"
            )
    return [
        {
            "key": key,
            "module": module,
            "name_key": f"categories.{module}.{key}",
            "sort_order": index,
        }
        for index, (key, module) in enumerate(sorted(modules.items()))
    ]


def upsert_categories(db: Session, categories: list[dict[str, str | int]]) -> None:
    """Wstawia nowe kategorie i aktualizuje istniejące (rozpoznaje je po key)."""
    stmt = insert(AssetCategory).values(categories)
    stmt = stmt.on_conflict_do_update(
        index_elements=["key"],
        set_={
            "module": stmt.excluded.module,
            "name_key": stmt.excluded.name_key,
            "sort_order": stmt.excluded.sort_order,
        },
    )
    db.execute(stmt)


def load_category_ids(db: Session) -> dict[str, int]:
    """Zwraca słownik key -> id kategorii z bazy, np. {"trees": 12}."""
    rows = db.execute(select(AssetCategory.key, AssetCategory.id)).all()
    return {key: category_id for key, category_id in rows}


def upsert_assets(db: Session, assets: list[Asset], category_ids: dict[str, int]) -> None:
    """Wstawia nowe assety i aktualizuje istniejące (rozpoznaje je po id)."""
    rows = [
        {
            "id": asset.id,
            "category_id": category_ids[asset.category],
            "name_key": asset.nameKey,
            "file_path": asset.file,
            "width": asset.width,
            "height": asset.height,
        }
        for asset in assets
    ]
    stmt = insert(AssetRow).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["id"],
        set_={column: stmt.excluded[column] for column in ASSET_UPDATE_COLUMNS},
    )
    db.execute(stmt)


def seed(db: Session, assets: list[Asset]) -> tuple[int, int]:
    """Wgrywa kategorie i assety w ramach transakcji sesji db; zwraca (liczba kategorii, liczba assetów)."""
    if not assets:
        return 0, 0
    categories = extract_categories(assets)
    upsert_categories(db, categories)
    category_ids = load_category_ids(db)
    upsert_assets(db, assets, category_ids)
    return len(categories), len(assets)


def main() -> None:
    """Czyta manifest, wgrywa go do bazy w jednej transakcji i drukuje podsumowanie."""
    manifest_path = load_settings().assets_manifest
    if not manifest_path.exists():
        print(f"Brak pliku manifestu: {manifest_path}. Nic do wgrania.")
        return
    assets = load_manifest(manifest_path)
    if not assets:
        print(f"Manifest {manifest_path} jest pusty. Nic do wgrania.")
        return

    with SessionLocal() as db, db.begin():
        category_count, asset_count = seed(db, assets)

    print(f"Gotowe: kategorie {category_count}, assety {asset_count} (z {manifest_path})")


if __name__ == "__main__":
    main()