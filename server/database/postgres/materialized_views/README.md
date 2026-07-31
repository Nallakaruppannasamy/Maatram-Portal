# Materialized Views

Pre-computed, physically stored query results for expensive analytics aggregations.

Unlike standard views (which run the query on every request), materialized views store the result set on disk. They must be explicitly refreshed on a schedule or triggered by the application.

## When to Use a Materialized View

Use a materialized view when:
- The query takes more than ~100ms to compute.
- The data does not need to be real-time (analytics tolerate a few minutes of lag).
- Multiple API calls read the same aggregated dataset.

## Naming Convention

```
mvw_<descriptive_name>
```

File naming:
```
NNN_<view_name>.sql
071_monthly_volunteer_growth_mvw.sql
072_zone_performance_ranking_mvw.sql
```

## Planned Materialized Views for This Project

| View Name | Purpose | Refresh Strategy |
|---|---|---|
| `mvw_monthly_volunteer_growth` | Monthly total approved hours — powers the admin line chart | Application-triggered on approval; scheduled nightly |
| `mvw_zone_performance_ranking` | Zone-level hours + approval rate ranking | Application-triggered on approval; scheduled nightly |
| `mvw_college_hours_summary` | College-wise hours totals for zone analytics bar chart | Scheduled nightly |

## Refresh Strategy

Materialized views must be refreshed after bulk data changes. Options:

1. **Application-triggered:** The service layer calls `REFRESH MATERIALIZED VIEW CONCURRENTLY mvw_<name>` after approval events using `prisma.$executeRaw`.
2. **Scheduled:** Use `pg_cron` extension (Supabase supports this on Pro plan) to refresh nightly at 02:00.

## How to Apply

```
1. Open Supabase Dashboard → SQL Editor
2. Paste the file contents
3. Click Run
4. Schedule a cron refresh if needed
```

## Rollback

```sql
DROP MATERIALIZED VIEW IF EXISTS mvw_<name>;
```
