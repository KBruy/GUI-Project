"""Testy opisu tabel (src/db/models.py) bez bazy danych: sprawdzają metadane SQLAlchemy.

Działają wszędzie, także w CI bez PostgreSQL.
"""

from typing import get_args

from sqlalchemy import CheckConstraint

from src.db.models import Base
from src.schemas.base import Module


def check_constraints(table_name: str) -> dict[str, str]:
    """Zwraca CHECK-i tabeli jako słownik nazwa → treść SQL (nazwy już po konwencji nazw)."""
    table = Base.metadata.tables[table_name]
    return {
        constraint.name: str(constraint.sqltext)
        for constraint in table.constraints
        if isinstance(constraint, CheckConstraint)
    }


def test_tables_match_technical_document():
    assert set(Base.metadata.tables) == {"asset_categories", "assets", "projects"}


def test_asset_categories_columns():
    columns = set(Base.metadata.tables["asset_categories"].columns.keys())
    assert columns == {"id", "key", "module", "name_key", "sort_order"}


def test_assets_columns():
    columns = set(Base.metadata.tables["assets"].columns.keys())
    assert columns == {"id", "category_id", "name_key", "file_path", "width", "height", "created_at"}


def test_projects_columns():
    columns = set(Base.metadata.tables["projects"].columns.keys())
    assert columns == {"id", "type", "name", "scene", "schema_version", "created_at", "updated_at"}


def test_category_key_is_unique():
    assert Base.metadata.tables["asset_categories"].c.key.unique is True


def test_module_check_allows_exactly_contract_modules():
    checks = check_constraints("asset_categories")
    assert "ck_asset_categories_module_allowed" in checks
    sql = checks["ck_asset_categories_module_allowed"]
    # Każda wartość z Literal Module (kontrakt API) musi być dozwolona w bazie.
    for module in get_args(Module):
        assert f"'{module}'" in sql


def test_type_check_allows_exactly_contract_modules():
    checks = check_constraints("projects")
    assert "ck_projects_type_allowed" in checks
    sql = checks["ck_projects_type_allowed"]
    assert sql.startswith("type IN")
    for module in get_args(Module):
        assert f"'{module}'" in sql


def test_projects_index_is_type_then_updated_at_desc():
    indexes = {index.name: index for index in Base.metadata.tables["projects"].indexes}
    index = indexes["ix_projects_type_updated_at"]
    assert [str(expression) for expression in index.expressions] == ["projects.type", "projects.updated_at DESC"]


def test_asset_category_fk_restricts_delete():
    (fk,) = Base.metadata.tables["assets"].c.category_id.foreign_keys
    assert fk.target_fullname == "asset_categories.id"
    assert fk.ondelete == "RESTRICT"