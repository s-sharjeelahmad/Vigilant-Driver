from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# BASE_DIR = Path(__file__).resolve().parent.parent


# 'NAME': os.getenv('DB_NAME'),
#         'USER': os.getenv('DB_USER'),


# SQLALCHEMY_DATABASE_URL = os.getenv('SUPABASE_DB_URL')
# SQLALCHEMY_DATABASE_URL = os.getenv('SUPABASE_DB_URL')
SQLALCHEMY_DATABASE_URL = os.getenv('SUPABASE_DB_URL')

if not SQLALCHEMY_DATABASE_URL:
    # Local fallback so backend can run when SUPABASE_DB_URL is not configured.
    project_root = Path(__file__).resolve().parents[2]
    sqlite_path = project_root / "backend" / "local.db"
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{sqlite_path.as_posix()}"

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=1800,
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def initialize_database() -> None:
    """Import models and create tables if they do not exist."""
    # Import inside the function so model registration is complete before create_all.
    from ..model_s import models as _models  # noqa: F401
    if str(engine.url).startswith("sqlite"):
        core_tables = [
            _models.Company.__table__,
            _models.Vehicle.__table__,
            _models.Driver.__table__,
            _models.DriverSession.__table__,
            _models.AdminUser.__table__,
        ]
        Base.metadata.create_all(bind=engine, tables=core_tables)
    else:
        Base.metadata.create_all(bind=engine)

# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
