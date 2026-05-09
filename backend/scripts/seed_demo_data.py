import uuid
import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database_c.database import Base
from backend.model_s.models import Company, Driver, DriverSession, Vehicle


DEMO_COMPANY_NAME = "Vigilant Demo Corp"
DEMO_VEHICLE_NUMBER = "VIG-001"
DEMO_VEHICLE_MODEL = "Oppo-Express"
DEMO_DRIVER_ID_HEX = "3b1405135c6a44ffb9ef97fb86f6a07e"
DEMO_DRIVER_PASSWORD = "password123"


def resolve_sqlite_path() -> Path:
    backend_dir = Path(__file__).resolve().parents[1]
    preferred = backend_dir / "vigilant.db"
    fallback = backend_dir / "local.db"

    # Prefer an existing DB file first to avoid seeding the wrong local database.
    if preferred.exists():
        return preferred
    if fallback.exists():
        return fallback

    # If neither exists, create the requested demo db name.
    return preferred


def main() -> None:
    sqlite_path = resolve_sqlite_path()
    engine = create_engine(
        f"sqlite:///{sqlite_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create only core tables required for auth and session flow in SQLite.
    Base.metadata.create_all(
        bind=engine,
        tables=[
            Company.__table__,
            Vehicle.__table__,
            Driver.__table__,
            DriverSession.__table__,
        ],
    )

    driver_uuid = uuid.UUID(DEMO_DRIVER_ID_HEX)

    with SessionLocal() as db:
        company = (
            db.query(Company)
            .filter(Company.company_name == DEMO_COMPANY_NAME)
            .first()
        )
        if not company:
            company = Company(
                company_name=DEMO_COMPANY_NAME,
                company_type="demo",
                email="demo@vigilant.local",
                password="demo_company_password",
                contact_number="03000000000",
                city="Karachi",
                is_verified=True,
                subscription_plan="premium",
                subscription_status="active",
            )
            db.add(company)
            db.flush()

        vehicle = (
            db.query(Vehicle)
            .filter(Vehicle.vehicle_number == DEMO_VEHICLE_NUMBER)
            .first()
        )
        if not vehicle:
            vehicle = Vehicle(
                company_id=company.company_id,
                vehicle_number=DEMO_VEHICLE_NUMBER,
                vehicle_type="car",
                make="Vigilant",
                model=DEMO_VEHICLE_MODEL,
                year=2026,
                is_active=True,
            )
            db.add(vehicle)
            db.flush()
        else:
            setattr(vehicle, "company_id", company.company_id)
            setattr(vehicle, "model", DEMO_VEHICLE_MODEL)
            setattr(vehicle, "is_active", True)

        driver = db.query(Driver).filter(Driver.driver_id == driver_uuid).first()
        if not driver:
            driver = Driver(
                driver_id=driver_uuid,
                cnic="1234567890123",
                full_name="Demo Driver",
                phone_number="03000000000",
                email="hello@example.com",
                password=DEMO_DRIVER_PASSWORD,
                license_number="DEMO-LIC-0001",
                city="Karachi",
                company_id=company.company_id,
                assigned_vehicle_id=vehicle.vehicle_id,
                is_active=True,
            )
            db.add(driver)
        else:
            setattr(driver, "password", DEMO_DRIVER_PASSWORD)
            setattr(driver, "company_id", company.company_id)
            setattr(driver, "assigned_vehicle_id", vehicle.vehicle_id)
            setattr(driver, "is_active", True)

        db.commit()

    print(f"Seed complete in: {sqlite_path}")
    print(f"Company: {DEMO_COMPANY_NAME}")
    print(f"Vehicle: {DEMO_VEHICLE_NUMBER} / {DEMO_VEHICLE_MODEL}")
    print(f"Driver: {driver_uuid} (password set to {DEMO_DRIVER_PASSWORD})")


if __name__ == "__main__":
    main()
