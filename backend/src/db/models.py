import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, MetaData, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

# Wzory nazw ograniczeń i indeksów
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",  # indeks
    "uq": "uq_%(table_name)s_%(column_0_name)s",  # unikalność
    "ck": "ck_%(table_name)s_%(constraint_name)s",  # check
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",  # klucz obcy
    "pk": "pk_%(table_name)s",  # klucz główny
}


class Base(DeclarativeBase):
    """Klasa bazowa wszystkich modeli; metadata zbiera tabele dla Alembica."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)

class AssetCategory(Base):
    """Kategoria assetów, np. "trees" w module map."""

    __tablename__ = "asset_categories"
    __table_args__ = (CheckConstraint("module IN ('map', 'character')", name="module_allowed"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(unique=True)
    module: Mapped[str]
    name_key: Mapped[str]
    sort_order: Mapped[int]

    assets: Mapped[list["Asset"]] = relationship(back_populates="category")


class Asset(Base):
    """Pojedynczy asset, np. drzewo lub postać; w scenie odwołujemy się do niego przez id."""

    __tablename__ = "assets"
    __table_args__ = (CheckConstraint("width > 0 AND height > 0", name="size_positive"),)

    # Identyfikator tekstowy, np. "map_tree_oak_01"; scena odwołuje się do assetu tylko przez to id.
    id: Mapped[str] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("asset_categories.id", ondelete="RESTRICT"), index=True)
    name_key: Mapped[str]
    file_path: Mapped[str]
    width: Mapped[int]
    height: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    category: Mapped["AssetCategory"] = relationship(back_populates="assets")


class Project(Base):
    """Projekt mapy lub postaci; cała scena leży w kolumnie scene (JSONB).
    """

    __tablename__ = "projects"
    __table_args__ = (CheckConstraint("type IN ('map', 'character')", name="type_allowed"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    type: Mapped[str]
    name: Mapped[str]
    scene: Mapped[dict[str, Any]] = mapped_column(JSONB)
    schema_version: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# Indeks pod listę projektów: filtr po typie, sortowanie od ostatnio zmienionego.
Index("ix_projects_type_updated_at", Project.type, Project.updated_at.desc())