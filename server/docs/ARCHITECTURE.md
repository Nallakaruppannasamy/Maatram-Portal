# Maatram Portal Backend Architecture

This document describes the design principles, architectural layers, data schema relations, and state machines governing Version 1 of the Maatram Portal.

---

## 1. Architectural Layers

The system follows a strict **Repository Pattern** layout ensuring concerns are separated and testable.

```
       Express Client (HTTP Requests)
                   │
                   ▼
       Router (Auth / RBAC Middlewares)
                   │
                   ▼
      Controller (HTTP Request/Response Handler)
                   │
                   ▼
       Service (Business Logic / Transactions)
                   │
                   ▼
       Repository (Database Queries / Prisma Client)
                   │
                   ▼
       PostgreSQL Database (Supabase)
```

### Components
1. **Routing Layer (`src/modules/*/*.routes.ts`)**: Defines URLs and maps them to controllers. Implements validation middlewares (`validate()`) and authentication guards (`requireAuth`, `requireRole()`).
2. **Controller Layer (`src/modules/*/*.controller.ts`)**: Translates HTTP request parameters, body, query options, and user details into service calls. Formats output using a standardized envelope.
3. **Service Layer (`src/modules/*/*.service.ts`)**: Implements strict business validation (e.g. email uniqueness, state machine transitions), database transactional blocks, audit logging calls, and computational fields (computed `fullName`).
4. **Repository Layer (`src/modules/*/*.repository.ts`)**: Encapsulates all interactions with the Prisma ORM. Eliminates DB-specific leakages into business logic.

---

## 2. Core Relational Data Schema

The database utilizes **PostgreSQL** configured via **Prisma ORM**. Key relationships are outlined below:

### User & Profiles
* **`User`** is the parent credential entity storing login credentials and role details.
* **`UserProfile`** is a 1-to-1 extension of `User` storing general staff bio, designate, and mobile details. Cascade deletes when `User` is deleted.
* **`Student`** is a 1-to-1 extension of `User` when `User.role = student`. Cascade deletes when `User` is deleted.

### Hierarchy & Grouping
* **`Organization`** has many `Zone`s, `User`s, `Student`s, and `Volunteer`s.
* **`Zone`** has many `Student`s, `Volunteer`s, and `User`s (assigned staff). Zone also optionally references a `User` as its `incharge` (1-to-1).
* **`College`** belongs to a `Zone` and contains multiple **`Department`** entities, which contain **`Program`** choices.

### Student Details
* A `Student` references exactly one `Organization`, `Zone`, `College`, `Department`, and `Program`.
* Deleting a `Student` cascade deletes their **`SemesterGrade`**, **`Skill`**, **`Project`**, and **`Certification`** entries.

### Volunteer Details
* A `Volunteer` references exactly one `Organization` and `Zone`.
* Deleting a `Volunteer` cascade deletes their **`VolunteerSkill`** entries.

---

## 3. Profile Status State Machines

To prevent invalid business states, both Student and Volunteer modules enforce strict transition diagrams.

### Student Status State Machine
```
      ┌───────────┐
  ┌──►│  ACTIVE   ├──────────────┐
  │   └─────┬─────┘              │
  │         │                    │
  │         ▼                    ▼
  │   ┌───────────┐        ┌───────────┐
  │   │ SUSPENDED │        │ GRADUATED │
  │   └─────┬─────┘        └─────┬─────┘
  │         │                    │
  │         ▼                    ▼
  │   ┌───────────┐        ┌───────────┐
  └───┤  DROPPED  │        │  ALUMNI   │
      └───────────┘        └───────────┘
```
* **Suspended Account Deactivation**: When a student is marked `SUSPENDED`, their linked `User.isActive` flag is programmatically set to `false`, immediately blocking all session logins.

### Volunteer Status State Machine
```
           ┌───────────┐
      ┌───►│  ACTIVE   ├──────────────┐
      │    └─────┬─────┘              │
      │          │                    │
      │          ▼                    ▼
  ┌───┴─────┐ ┌──┴────────┐   ┌───────┴───┐
  │INACTIVE │ │ ON_LEAVE  │   │ SUSPENDED │
  └─────────┘ └───────────┘   └───────────┘
                       \        /
                        ▼      ▼
                      ┌───────────┐
                      │  EXITED   │
                      └───────────┘
```
* **Terminal States**: Status `EXITED` represents a terminal condition from which no further transitions are permitted.

---

## 4. Security & Isolation Model

1. **Role-Based Access Control (RBAC)**: Valid roles are `admin`, `zone`, and `student`. Admin users possess global permission write parameters. Zone managers are restricted to read operations on students/volunteers under their organization scope.
2. **Session Security & Refresh Token Rotation**: Refresh tokens are stored in the database in hashed form (SHA-256). Any attempt to reuse a rotated token results in immediate revocation of all active sessions for that user.
3. **Database Parameterization**: Prisma ORM enforces parameterized SQL query constructs by default, isolating application layers from SQL injection vectors.
4. **Zod Validation**: Validates type safety, regex patterns, and range constructs at routing borders before requests enter application controllers.
