"""
Database initialization and seeding script.
Creates all tables and loads seed data if empty.
"""

import sys
from pathlib import Path

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.models import Base, engine, SessionLocal, User
from sqlalchemy import text


def init_database():
    print("Creating all tables via SQLAlchemy Base metadata...")

    # Create all database tables
    Base.metadata.create_all(bind=engine)

    print("Tables created successfully.")

    db = SessionLocal()

    try:
        # Check whether database already contains users
        user_count = db.query(User).count()

        if user_count == 0:
            print("Seeding initial dataset from database/seed_data.sql...")

            seed_file = ROOT_DIR / "database" / "seed_data.sql"

            if not seed_file.exists():
                print(f"Warning: Seed file not found at {seed_file}")
                return

            # Read seed SQL file
            with open(seed_file, "r", encoding="utf-8") as f:
                sql_content = f.read()

            # ---------------------------------------------------------
            # Remove SQL comment lines before executing statements.
            #
            # The seed file contains sections such as:
            #
            # -- 1. Users
            # INSERT OR REPLACE INTO users ...
            #
            # Previously, the entire block was skipped because it
            # started with "--".
            # ---------------------------------------------------------
            cleaned_lines = []

            for line in sql_content.splitlines():
                stripped_line = line.strip()

                # Ignore full-line SQL comments
                if stripped_line.startswith("--"):
                    continue

                cleaned_lines.append(line)

            cleaned_sql = "\n".join(cleaned_lines)

            # ---------------------------------------------------------
            # Execute each SQL statement separately
            # ---------------------------------------------------------
            statements = cleaned_sql.split(";")

            executed_count = 0

            with engine.begin() as conn:
                for statement in statements:
                    stmt = statement.strip()

                    if not stmt:
                        continue

                    conn.execute(text(stmt))
                    executed_count += 1

            print(
                f"Seed data successfully loaded! "
                f"Executed {executed_count} SQL statements."
            )

        else:
            print(
                f"Database already populated "
                f"({user_count} users found). Skipping seed."
            )

    except Exception as e:
        print(f"Error during database initialization/seeding: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    init_database()