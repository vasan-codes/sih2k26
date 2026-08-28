from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

DB_PATH = Path(__file__).resolve().parents[2] / "satquery.db"
ENGINE_URL = f"sqlite:///{DB_PATH}"

# NOTE: swapping to PostgreSQL+PostGIS in production is a config change here --
# e.g. ENGINE_URL = "postgresql+psycopg://user:pass@host/satquery" -- the rest of the
# app talks to SQLAlchemy models, not to SQLite directly.
engine = create_engine(ENGINE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
