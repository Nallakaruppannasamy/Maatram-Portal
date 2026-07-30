-- =======================================================
-- FILE: 001_extensions.sql
-- PURPOSE: Enable required PostgreSQL extensions.
-- NOTE: Prisma uses these extensions (e.g. uuid-ossp for gen_random_uuid())
--       when creating tables during migrations.
-- APPLIED BEFORE: Any Prisma migration.
-- IDEMPOTENT: Yes (IF NOT EXISTS)
-- =======================================================

-- Enable UUID generation support for key primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic utility support (useful for hashing tokens)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable trigram indexing for fuzzy name/email/register number searching
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
