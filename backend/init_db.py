"""
Database initialization and seeding script.
Creates all tables and loads seed data if empty.
"""
import sys
import os
from pathlib import Path

# Ensure root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.models import Base, engine, SessionLocal, User
from sqlalchemy import text

def init_database():
    print("Creating all tables via SQLAlchemy Base metadata...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    # Check if seed data is needed
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("Seeding initial dataset from database/seed_data.sql...")
            seed_file = Path(__file__).resolve().parent.parent / "database" / "seed_data.sql"
            if seed_file.exists():
                with open(seed_file, "r", encoding="utf-8") as f:
                    sql_statements = f.read()

                # Execute individual statements
                with engine.begin() as conn:
                    for statement in sql_statements.split(";"):
                        stmt = statement.strip()
                        if stmt and not stmt.startswith("--"):
                            conn.execute(text(stmt))
                print("Seed data successfully loaded!")
            else:
                print(f"Warning: Seed file not found at {seed_file}")
        else:
            print(f"Database already populated ({user_count} users found). Skipping seed.")
    except Exception as e:
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
