"""Konfiguracja Alembica: skąd wziąć adres bazy i opis tabel.

Adres bazy pochodzi z src/config.py (zmienna DATABASE_URL), tak samo jak w aplikacji,
więc alembic.ini nie zawiera hasła. Opis tabel to metadata z src/db/models.py;
porównuje go z bazą `alembic revision --autogenerate`.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from src.config import load_settings
from src.db.models import Base

# Obiekt z ustawieniami z alembic.ini.
config = context.config

# Ustawienia logowania z alembic.ini (sekcje [loggers], [handlers] itd.).
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Opis wszystkich tabel z models.py; autogenerate porównuje go z bazą.
target_metadata = Base.metadata


def database_url() -> str:
    """Zwraca adres bazy: ustawiony w kodzie (testy przez set_main_option) albo z ustawień aplikacji."""
    return config.get_main_option("sqlalchemy.url") or load_settings().database_url


def run_migrations_offline() -> None:
    """Tryb --sql: wypisuje SQL migracji zamiast łączyć się z bazą."""
    context.configure(
        url=database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Zwykły tryb: łączy się z bazą i wykonuje migracje w transakcji."""
    # NullPool: migracja jest jednorazowa, więc nie trzymamy zapasowych połączeń.
    connectable = create_engine(database_url(), poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()