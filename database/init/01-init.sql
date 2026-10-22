-- This file runs automatically when the PostgreSQL container is created for
-- the first time (mounted into /docker-entrypoint-initdb.d/).
-- Actual table creation is handled by Alembic migrations in the backend
-- service on startup; this script only ensures required extensions exist.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
