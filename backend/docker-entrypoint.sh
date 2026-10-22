#!/bin/sh
set -e

echo "Waiting for database..."
python - << 'PYEOF'
import time
import sys
from sqlalchemy import create_engine, text
from app.config import settings

for attempt in range(30):
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database is ready.")
        sys.exit(0)
    except Exception as e:
        print(f"Database not ready (attempt {attempt + 1}/30): {e}")
        time.sleep(2)
print("Database never became ready.")
sys.exit(1)
PYEOF

echo "Running migrations..."
alembic upgrade head

echo "Seeding demo data..."
python -m scripts.seed || echo "Seeding skipped/failed (non-fatal)."

echo "Starting application..."
exec "$@"
