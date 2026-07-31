# Views

Standard SQL views for the Maatram application.

Views are **read-only query aliases** — they simplify complex joins into named, reusable queries. The application calls views via `prisma.$queryRaw` in repository files.

## When to Use a View

Use a view when:
- A query joins 3 or more tables and is called from multiple places in the codebase.
- A query computes aggregates (sums, counts) that are needed by an API endpoint but cannot be expressed cleanly as a single Prisma query.
- An analytics or reporting endpoint needs a stable, named data surface.

Do **not** use a view for simple CRUD lookups — use Prisma models directly for those.

## Naming Convention

```
vw_<descriptive_name>
```

File naming:
```
NNN_<view_name>.sql
061_student_summary_view.sql
062_zone_stats_view.sql
063_volunteer_report_view.sql
```

## Planned Views for This Project

| View Name | Purpose | Used By |
|---|---|---|
| `vw_student_summary` | Student KPIs per zone (hours, count, avg CGPA) | Admin dashboard, zone dashboard |
| `vw_zone_stats` | Aggregate stats per zone (pending count, approval rate) | Zone dashboard |
| `vw_volunteer_report` | Approved submissions with student + college info | Reports module |
| `vw_college_summary` | Per-college student and hours totals | Zone analytics |

## How to Apply

```
1. Open Supabase Dashboard → SQL Editor
2. Paste the file contents
3. Click Run
4. Confirm the view appears in Table Editor → Views
```

## Rollback

```sql
DROP VIEW IF EXISTS vw_<name>;
```

## Application Usage Pattern

```typescript
// In a repository file:
const rows = await prisma.$queryRaw`
  SELECT * FROM vw_zone_stats WHERE zone_id = ${zoneId}
`;
```
