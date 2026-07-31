# Extensions

PostgreSQL extensions required by the application.

Apply **once**, before running any Prisma migration, to the target Supabase database via the SQL Editor.

## Required Extensions

| Extension | Purpose |
|---|---|
| `uuid-ossp` | Provides `uuid_generate_v4()`. Used by Prisma for UUID primary keys. |
| `pgcrypto` | Cryptographic functions. Used for hashing password-reset tokens server-side. |
| `pg_trgm` | Trigram similarity. Required by the full-text GIN indexes on `students.full_name` and `students.register_number`. |

## Naming Convention

```
NNN_<descriptive_name>.sql
001_extensions.sql
```

## Application Order

Extensions must be applied **before** Prisma migrations run, because Prisma-generated SQL may reference `uuid_generate_v4()`.

## How to Apply

```
1. Open Supabase Dashboard → SQL Editor
2. Paste the file contents
3. Click Run
4. Confirm no errors
```

## Rollback

Extensions cannot be safely removed once data depends on them. To roll back, drop data first, then `DROP EXTENSION IF EXISTS <name>;`. Document any rollback in `database/README.md`.
