"""Połączenie z bazą: silnik, fabryka sesji i zależność get_db dla FastAPI."""
from collections.abc import Iterator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from src.config import DB_CONNECT_TIMEOUT_SECONDS, load_settings

#ładuje ustawienia z config.py
settings = load_settings()
#tworzy silnik i trzyma fabrykę sesji w module, żeby nie tworzyć ich przy każdym żądaniu
engine = create_engine(settings.database_url, pool_pre_ping=True, connect_args={"connect_timeout": DB_CONNECT_TIMEOUT_SECONDS},)
#tworzy fabrykę sesji, która będzie używana w zależności get_db
SessionLocal = sessionmaker(bind=engine)

#Definiuje zależność FastAPI, która tworzy sesję i zamyka ją po zakończeniu żądania.
def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()