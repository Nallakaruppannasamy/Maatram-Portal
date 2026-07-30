# Functions

Reusable PostgreSQL functions called by the application or referenced by triggers.

Functions live entirely inside the database engine. The application calls them via `prisma.$queryRaw` or `prisma.$executeRaw`. They are never called directly from TypeScript logic — the repository layer is responsible for invoking them.

## Naming Convention

Function names use `snake_case` with a descriptive verb prefix.

```
calculate_<metric>
generate_<code>
validate_<rule>
get_<aggregation>
```

File naming:
```
NNN_<function_name>.sql
076_calculate_resume_completeness.sql
077_generate_verification_code.sql
078_generate_submission_code.sql
079_get_student_approved_hours.sql
```

## Planned Functions for This Project

| Function Name | Returns | Called By | Purpose |
|---|---|---|---|
| `calculate_resume_completeness(student_id UUID)` | `INTEGER (0–100)` | Profile service, Dashboard service | Computes resume fill % across profile tabs |
| `generate_verification_code(register_number TEXT, year INTEGER)` | `TEXT` | Enrollment service | Produces MTM-{year}-{regNo} codes |
| `generate_submission_code(register_number TEXT)` | `TEXT` | Volunteers service | Produces VLOG-{regNo}-{seq} codes |
| `get_student_approved_hours(student_id UUID)` | `NUMERIC` | Dashboard service | Returns total approved volunteer hours |

## Rules

1. Functions must be **deterministic** wherever possible (same input → same output).
2. Functions that have side effects (e.g., write to another table) must be clearly documented with `-- SIDE EFFECT:` comments.
3. All functions must include explicit `SECURITY DEFINER` or `SECURITY INVOKER` declaration.
4. All parameters must be explicitly typed with PostgreSQL types.

## How to Apply

```
1. Open Supabase Dashboard → SQL Editor
2. Paste the file contents
3. Click Run
4. Verify the function appears under Database → Functions
```

## Rollback

```sql
DROP FUNCTION IF EXISTS <function_name>(<param_types>);
```

## Application Usage Pattern

```typescript
// In a repository file:
const [result] = await prisma.$queryRaw<[{ score: number }]>`
  SELECT calculate_resume_completeness(${studentId}::uuid) AS score
`;
return result.score;
```
