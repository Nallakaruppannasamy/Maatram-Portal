# Triggers

Database-level event handlers that fire automatically on INSERT, UPDATE, or DELETE.

Triggers allow the database to enforce cross-table consistency and automate audit trails without requiring changes to every application code path that modifies data.

## Naming Convention

Trigger names follow: `trg_<table>_<timing>_<event>`

```
trg_volunteer_submissions_after_update_status
trg_students_after_update_audit
trg_all_tables_before_update_set_updated_at
```

File naming:
```
NNN_<trigger_name>.sql
091_updated_at_trigger.sql
092_audit_log_trigger.sql
093_volunteer_notification_trigger.sql
```

## Structure: One File = Function + Trigger

Each trigger file must contain **two things**:
1. The **trigger function** (the PL/pgSQL logic to execute)
2. The **CREATE TRIGGER** statement (which binds the function to a table and event)

## Planned Triggers for This Project

| Trigger Name | Table | Event | Timing | Purpose |
|---|---|---|---|---|
| `trg_updated_at` | All tables | UPDATE | BEFORE | Auto-update `updated_at` timestamp |
| `trg_audit_row_changes` | Key tables | INSERT, UPDATE, DELETE | AFTER | Write to `_row_audit_log` shadow table |
| `trg_volunteer_status_changed` | `volunteer_submissions` | UPDATE | AFTER | Dispatch notification when status changes |

## Rules

1. Trigger functions must be defined **before** the `CREATE TRIGGER` statement in the same file.
2. Trigger functions must return `TRIGGER` type.
3. For `BEFORE` triggers, the function must `RETURN NEW` or `RETURN NULL`.
4. For `AFTER` triggers, the function must `RETURN NULL`.
5. Each trigger file must be idempotent — use `CREATE OR REPLACE FUNCTION` and `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`.

## How to Apply

```
1. Open Supabase Dashboard → SQL Editor
2. Paste the file contents
3. Click Run
4. Verify the trigger appears under Database → Triggers
```

## Rollback

```sql
DROP TRIGGER IF EXISTS <trigger_name> ON <table_name>;
DROP FUNCTION IF EXISTS <function_name>();
```

## Application Impact

Triggers are **transparent to the application layer** — they execute inside the database transaction that caused the event. The Express service layer does not need to call any trigger; triggers fire automatically.
