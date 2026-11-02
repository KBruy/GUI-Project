import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, MetaData, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

#Wzory nazw 
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s", #indeks
    "uq": "uq_%(table_name)s_%(column_0_name)s", #unikalność
    "ck": "ck_%(table_name)s_%(constraint_name)s", #check
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s", #klucz obcy
    "pk": "pk_%(table_name)s", #klucz główny
}

# Klasa bazowa dla wszystkich modeli SQLAlchemy
class Base(DeclarativeBase):
    # Ustawienie konwencji nazewnictwa dla metadanych
    metadata = MetaData(naming_convention=NAMING_CONVENTION)

#Dozwolone moduły
MODULES=("map", "character")

#Kategorie assetów szkic tabeli
class AssetCategory(Base):
    __tablename__ = "asset_category"
    __table_args__ = (
        CheckConstraint("name IN ('map', 'character')", name="module_allowed"),
        )
    id: Mapped[int]= mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(unique=True)
    module: Mapped[str]
    name_key: Mapped[str]
    sort_order: Mapped[int]

    # Lista assetów tej kategorii.
    assets: Mapped[list["Asset"]] = relationship(back_populates="category")

class Asset(Base):
    __tablename__ = "asset"
    id: Mapped[str] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("asset_category.id"), index=True)
    name_key: Mapped[str]
    file_path: Mapped[str]
    width: Mapped[int]
    height: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relacja do kategorii assetu.
    category: Mapped["AssetCategory"] = relationship(back_populates="assets")

class Project(Base):
    __tablename__ = "project"
    __table_args__ = (
        CheckConstraint("type IN ('map', 'character')", name="type_allowed"),
    )
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    type: Mapped[str]
    name: Mapped[str]
    scene_data: Mapped[dict[str, Any]] = mapped_column(JSONB)
    schema_version: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    Index("ix_projects_type_updated_at", Project.type, Project.updated_at.desc())
