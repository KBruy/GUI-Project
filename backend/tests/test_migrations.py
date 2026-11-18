"""Testy migracji Alembic i ograniczeń tabel na prawdziwym PostgreSQL.

Testy działają na osobnej bazie <nazwa>_test, tworzonej od nowa i usuwanej na końcu,
więc nie ruszają danych w bazie deweloperskiej. Bez działającej bazy są pomijane (skip).
Fixture bazy (test_db_url, alembic_cfg, engine, session) są w conftest.py.
"""

import uuid

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import Engine, inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.db.models import Asset, AssetCategory, Base, Project


def make_category(**overrides) -> AssetCategory:
    values = {"key": "trees", "module": "map", "name_key": "assets.category.trees", "sort_order": 1}
    return AssetCategory(**(values | overrides))


def make_project(**overrides) -> Project:
    values = {
        "id": uuid.uuid4(),
        "type": "map",
        "name": "Wioska",
        "scene": {"schemaVersion": 1, "layers": []},
        "schema_version": 1,
    }
    return Project(**(values | overrides))


def test_migration_matches_models(engine: Engine):
    # Ta sama kontrola co `alembic check`: pusta lista = migracje tworzą dokładnie to, co opisują modele.
    with engine.connect() as connection:
        diff = compare_metadata(MigrationContext.configure(connection), Base.metadata)
    assert diff == []


def test_projects_index_exists(engine: Engine):
    indexes = {index["name"]: index for index in inspect(engine).get_indexes("projects")}
    assert indexes["ix_projects_type_updated_at"]["column_names"] == ["type", "updated_at"]
    assert indexes["ix_projects_type_updated_at"]["column_sorting"] == {"updated_at": ("desc",)}


def test_downgrade_and_upgrade_again(alembic_cfg: Config, engine: Engine):
    config = alembic_cfg
    command.downgrade(config, "base")
    # Zostaje tylko tabela z numerem wersji Alembica.
    assert set(inspect(engine).get_table_names()) == {"alembic_version"}
    command.upgrade(config, "head")
    assert {"asset_categories", "assets", "projects"} <= set(inspect(engine).get_table_names())


@pytest.mark.parametrize("module", ["map", "character"])
def test_category_accepts_allowed_module(session: Session, module: str):
    session.add(make_category(module=module))
    session.flush()


def test_category_rejects_unknown_module(session: Session):
    session.add(make_category(module="weapon"))
    with pytest.raises(IntegrityError, match="ck_asset_categories_module_allowed"):
        session.flush()


def test_category_key_is_unique(session: Session):
    session.add(make_category())
    session.flush()
    session.add(make_category(module="character"))
    with pytest.raises(IntegrityError, match="uq_asset_categories_key"):
        session.flush()


def test_asset_requires_existing_category(session: Session):
    session.add(Asset(id="x", category_id=999, name_key="k", file_path="x.png", width=1, height=1))
    with pytest.raises(IntegrityError, match="fk_assets_category_id_asset_categories"):
        session.flush()


def test_asset_rejects_zero_size(session: Session):
    category = make_category()
    session.add(Asset(id="x", category=category, name_key="k", file_path="x.png", width=0, height=1))
    with pytest.raises(IntegrityError, match="ck_assets_size_positive"):
        session.flush()


def test_category_with_assets_cannot_be_deleted(session: Session):
    category = make_category()
    session.add(Asset(id="map_tree_oak_01", category=category, name_key="k", file_path="a.png", width=64, height=96))
    session.flush()
    with pytest.raises(IntegrityError):
        session.execute(text("DELETE FROM asset_categories"))


def test_project_rejects_unknown_type(session: Session):
    session.add(make_project(type="weapon"))
    with pytest.raises(IntegrityError, match="ck_projects_type_allowed"):
        session.flush()


def test_project_scene_round_trip(session: Session):
    scene = {"schemaVersion": 1, "name": "Wioska", "layers": [{"id": "l1", "objects": []}]}
    project = make_project(scene=scene)
    session.add(project)
    session.flush()
    session.expire_all()
    stored = session.get(Project, project.id)
    assert stored is not None
    assert stored.scene == scene
    # Daty z server_default, gdy nikt ich nie podał.
    assert stored.created_at is not None and stored.updated_at is not None