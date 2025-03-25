# Modelli/Schema sessioni terapeutiche
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

settings = get_settings()

# Creazione dell'engine SQLAlchemy
engine = create_engine(settings.DATABASE_URL)

# Sessionmaker configurato con l'engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class per i modelli SQLAlchemy
Base = declarative_base()


def get_db():
    """
    Dependency per ottenere una sessione database.
    Da utilizzare con FastAPI Depends.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()