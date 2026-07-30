# Performance

Query performance tuning files: advanced indexes that Prisma cannot generate.

Prisma automatically creates indexes for `@id`, `@unique`, and `@@unique` fields. Everything else — composite indexes, partial indexes, GIN indexes for full-text search, expression indexes — must be written here.

## What Goes in This Folder

| Index Type | When to Use | Prisma Covers? |
|---|---|---|
| Single-column FK index | Every foreign key column | No |
| Composite index | Multi-column WHERE clauses | No |
| Partial index | Filter on a subset of rows | No |
| GIN index (pg_trgm) | ILIKE / full-text search | No |
| Expression index | Index on a function result | No |
| Primary key index | Auto-created | Yes |
| Unique constraint index | `@unique` in schema.prisma | Yes |

## Naming Convention

Index names follow: `idx_<table>_<columns_or_purpose>`

```
idx_students_zone_id
idx_volunteer_submissions_zone_status
idx_students_full_name_trgm
```

File naming:
```
NNN_<purpose>_indexes.sql
021_fk_indexes.sql           -- All foreign key column indexes
022_composite_indexes.sql    -- Multi-column query indexes
023_full_text_indexes.sql    -- GIN / pg_trgm indexes for search
024_partial_indexes.sql      -- Partial indexes (filtered)
```

## Planned Indexes for This Project

### Foreign Key Indexes (021)
Prisma does not add indexes to FK columns by default. Every FK column must have one.

Tables and FK columns requiring indexes:
- `students` → `user_id`, `zone_id`, `college_id`, `department_id`, `program_id`
- `volunteer_submissions` → `student_id`, `zone_id`, `reviewed_by_id`
- `notifications` → `recipient_id`
- `audit_logs` → `actor_id`
- `zones` → `incharge_id`
- `colleges` → `zone_id`
- `departments` → `college_id`
- `programs` → `department_id`
- `semester_grades` → `student_id`
- `skills` → `student_id`
- `projects` → `student_id`
- `certifications` → `student_id`
- `password_reset_tokens` → `user_id`
- `refresh_tokens` → `user_id`
- `enrollment_imports` → `imported_by_id`

### Composite Indexes (022)
Correspond directly to application query patterns:

| Index | Query Pattern | Endpoint |
|---|---|---|
| `(zone_id, status, created_at)` on `volunteer_submissions` | Approval queue | Zone approval page |
| `(student_id, status, event_date)` on `volunteer_submissions` | Student history | History page |
| `(zone_id, event_date, status)` on `volunteer_submissions` | Analytics date range | Analytics page |
| `(zone_id, college_id)` on `students` | Zone student directory | Zone student page |
| `(recipient_id, is_read)` on `notifications` | Unread count badge | Sidebar |
| `(action, created_at)` on `audit_logs` | Audit filter | Audit logs page |

### Full-Text Indexes (023)
Required for the global student search on `name` and `register_number`:

- GIN index on `students.full_name` with `gin_trgm_ops`
- GIN index on `students.register_number` with `gin_trgm_ops`
- GIN index on `users.email` with `gin_trgm_ops`

**Requires:** `pg_trgm` extension to be installed first.

### Partial Indexes (024)
Index only the rows that queries actually filter against:

- `refresh_tokens WHERE revoked_at IS NULL` — only active tokens
- `password_reset_tokens WHERE used_at IS NULL` — only unused tokens
- `users WHERE is_active = TRUE` — only active accounts

## Rules

1. Every file must use `CREATE INDEX IF NOT EXISTS` — idempotent.
2. Every index must include a comment explaining which query it serves.
3. Before adding an index, confirm the query plan shows a sequential scan (`EXPLAIN ANALYZE`).
4. Do not add indexes speculatively. Add them when a real query needs them.

## How to Apply

```
1. Extensions must already be applied (pg_trgm required for GIN indexes)
2. Prisma migration must already be applied (tables must exist)
3. Open Supabase Dashboard → SQL Editor
4. Paste and run each file in numerical order
```

## Rollback

```sql
DROP INDEX IF EXISTS idx_<name>;
```
