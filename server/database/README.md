# Database — PostgreSQL Configuration & Workflows

This directory manages the advanced PostgreSQL database objects that Prisma ORM cannot declaratively define or manage natively. 

Prisma is the **single source of truth** for the database schema (tables, columns, types, foreign key relationships, standard indexes, unique constraints, and enums).

Handwritten SQL in this directory is used **only** for advanced PostgreSQL-native features.

## Folder Directory Structure

```
database/
├── postgres/
│   ├── extensions/          # SQL scripts to enable required PostgreSQL extensions
│   ├── views/               # Standard PostgreSQL read-only query views
│   ├── materialized_views/  # Materialized views for performance-critical caching
│   ├── functions/           # Database-level functions and stored procedures (PL/pgSQL)
│   ├── triggers/            # Trigger definitions binding functions to table events
│   └── performance/         # Advanced query tuning (e.g. partial, GIN/trgm indexes)
│
├── README.md                # Database strategy, standards, and workflow (this file)
└── migrations.log           # Plaintext log tracking manual SQL deployment history
```

## Folder Responsibilities & Naming Conventions

### 1. `postgres/extensions/`
- **Purpose:** SQL scripts to enable required PostgreSQL extensions (e.g., `uuid-ossp`, `pg_trgm`, `pgcrypto`).
- **Rule:** Applied once, before running any Prisma migration.
- **Naming:** `NNN_<name>.sql` (e.g., `001_extensions.sql`).

### 2. `postgres/views/`
- **Purpose:** Standard SQL views. Query results computed on-demand.
- **Naming:** Prefix with `vw_` and suffix with `.sql` (e.g., `vw_student_summary.sql`).

### 3. `postgres/materialized_views/`
- **Purpose:** Physically cached query results for heavy aggregations. Must include a refresh strategy.
- **Naming:** Prefix with `mvw_` and suffix with `.sql` (e.g., `mvw_monthly_volunteer_growth.sql`).

### 4. `postgres/functions/`
- **Purpose:** Reusable PL/pgSQL database functions and stored procedures.
- **Naming:** Use lowercase `snake_case` with a verb prefix (e.g., `calculate_resume_completeness.sql`).

### 5. `postgres/triggers/`
- **Purpose:** Database-level triggers executing functions automatically on table modifications (BEFORE/AFTER INSERT/UPDATE/DELETE).
- **Naming:** Prefix with `trg_` and suffix with `.sql` (e.g., `trg_updated_at.sql`).

### 6. `postgres/performance/`
- **Purpose:** Performance query tuning scripts containing indexes Prisma cannot natively generate (e.g., GIN trigram indexes for search, expression indexes, or partial indexes).
- **Naming:** Prefix with `idx_` and suffix with `.sql` (e.g., `idx_full_text_search.sql`).

---

## The Database Migration Workflow

To keep environments in sync, all database changes must flow in one direction:

```
[ Developer updates prisma/schema.prisma ]
                   │
                   ▼
  [ Run local Prisma migration script ]
  npx prisma migrate dev --name <description>
                   │
                   ▼
  [ Review generated SQL migration file ]
  (Found inside prisma/migrations/<timestamp>_/)
                   │
                   ▼
  [ Apply advanced SQL/view/trigger objects ]
  (Only if needed, via database/postgres/ scripts)
                   │
                   ▼
  [ Apply migrations to Supabase Database ]
  (Staging or production database via CI/CD or SQL runner)
                   │
                   ▼
  [ Commit all schema, migrations, and SQL files to Git ]
```

### Why this workflow must be followed:
1. **Single Source of Truth:** Code in the repository defines the database. We do not edit tables manually inside the Supabase dashboard.
2. **Deterministic Builds:** The migration history is applied sequentially by Prisma CLI, guaranteeing the database structure is identical on every environment (development, testing, staging, production).
3. **Rollback Auditing:** All changes are version-controlled in Git, making it easy to track down bugs and audit DDL updates.

---

## migrations.log Format

Every time a database script is applied to a shared environment (staging/production), log it here manually or via CI script:

```
DATE        | FILE                            | ENV        | APPLIED_BY    | NOTES
------------|---------------------------------|------------|---------------|----------------------------------
2026-07-29  | prisma:20260729_init            | staging    | dev-principal | Created initial 16 tables
2026-07-29  | 001_extensions.sql              | staging    | dev-principal | Enabled uuid, trgm, pgcrypto
2026-07-29  | 061_student_summary_view.sql    | staging    | dev-principal | Created student summary view
```
