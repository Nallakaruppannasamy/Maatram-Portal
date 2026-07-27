# Maatram Foundation — Student & Volunteer Management System (SVMS)

An enterprise-grade, production-ready Student & Volunteer Management System (SVMS) designed to centralize student records, manage volunteering activities, coordinate organization hierarchy, and generate professional resumes and reports for the Maatram Foundation.

---

## 🚀 Key Features

*   **Centralized Student Registry:** Build complete profile portfolios for students including contact information, academic records, skills, projects, achievements, and certifications.
*   **Hierarchical Organization Management:** Manage organizational trees spanning Zones, Colleges, Departments, Programs, and Batches.
*   **Volunteer Verification Workflow:** Student submission of volunteer hours with file proof uploads, followed by a multi-stage approval workflow (Pending, Approved, Rejected, Revision) for Zone Incharges.
*   **Automatic Resume Generation:** Async generation of professional PDF resumes from verified student profile data using Puppeteer, equipped with a QR verification code.
*   **Analytics Engine:** Role-based dashboard widgets displaying participation, cumulative volunteer hours, growth metrics, and compliance trends.
*   **Bulk Student Enrollment:** Excel parsing with validation, duplicate detection, and automated credentials dispatch via a background job queue.
*   **Audit Logging:** Detailed system-wide audit logs capturing every state change with actor profiles and field diffs.
*   **Notification Engine:** Seamless delivery of transactional emails and real-time in-app alerts.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Shadcn/UI, React Router v6, TanStack Query v5, Zustand, React Hook Form, Zod, Axios, Recharts, Framer Motion |
| **Backend** | Node.js (v20 LTS), Express.js, TypeScript, Prisma ORM, Zod, Multer, Cloudinary SDK, Nodemailer, BullMQ, Redis |
| **Database** | PostgreSQL 16 (Primary Store), Redis (Cache & Queue Broker) |
| **Testing** | Vitest, Supertest, React Testing Library, Playwright |
| **DevOps / Infra** | Docker, Docker Compose, Nginx (Reverse Proxy & Static Server), GitHub Actions |

---

## 📁 Repository Structure

The project follows a **Feature-First Monorepo Monolith** architecture where both client and server are organized around isolated business domains.

```
maatram/
├── .github/workflows/       # GitHub Actions CI/CD workflows
├── client/                  # Frontend SPA application (Vite + React)
│   ├── public/              # Static public assets
│   └── src/
│       ├── app/             # Global core setup & entrypoints
│       ├── components/      # Shared UI component library (ui, shared, charts, etc.)
│       ├── features/        # Feature-first modular slices (auth, student, volunteer, etc.)
│       │   └── <feature>/   # components, pages, hooks, services, schemas, index.ts
│       ├── providers/       # Global context providers (Query, Auth, Theme)
│       └── routes/          # Layout configurations and route tree definitions
├── server/                  # Backend API application (Express.js)
│   ├── prisma/              # Prisma schema & migration definitions
│   └── src/
│       ├── bootstrap/       # Application bootstrap loaders
│       ├── common/          # Reusable middleware, custom exceptions, responses, guards
│       ├── config/          # Core environment & library configurations
│       ├── jobs/            # BullMQ queues, workers, and schedulers
│       └── modules/         # Feature-first backend slices (auth, students, volunteers, etc.)
│           └── <module>/    # controller, service, repository, validator, routes, DTOs, tests
├── docker/                  # Dockerfiles and Nginx reverse proxy configurations
├── docs/                    # Architecture blueprints, API specs, database designs
└── scripts/                 # Administration utility scripts (seeding, bulk imports, migrations)
```

---

## 💻 Local Development Setup

### Prerequisites

*   **Node.js** (v20 LTS or higher)
*   **Docker & Docker Compose**
*   **NPM / PNPM** (Workspace managers)

### Setup Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/maatram-foundation/svms.git
    cd svms
    ```

2.  **Install Dependencies:**
    ```bash
    # Install dependencies across all workspaces
    npm install
    ```

3.  **Environment Configuration:**
    Configure environment variables for the backend and frontend services.
    ```bash
    # Create backend environment variables
    cp server/.env.example server/.env

    # Create frontend environment variables
    cp client/.env.example client/.env
    ```

4.  **Launch Infrastructure Dependencies:**
    Use Docker Compose to launch PostgreSQL, Redis, and Mailpit (local SMTP mail catcher).
    ```bash
    docker compose up -d
    ```

5.  **Initialize Database:**
    Run migrations and seed the database with core organizational data and test user accounts.
    ```bash
    cd server
    npx prisma migrate dev
    npm run db:seed
    ```

6.  **Start Services in Development Mode:**
    ```bash
    # Start both client and server development servers simultaneously from the root
    npm run dev
    ```

---

## 🧪 Testing

The codebase maintains strict quality gates through isolated testing structures.

```bash
# Run backend unit and integration tests
cd server && npm run test

# Run frontend unit and component tests
cd client && npm run test

# Run End-to-End browser tests (Playwright)
npm run test:e2e
```

---

## 🔒 Coding Standards & Commit Guidelines

*   **TypeScript:** Strict mode is enforced. Avoid `any` types; define clear interfaces and DTOs.
*   **Feature Isolation:** Do not directly import files across feature directories. Inter-module communication must traverse services.
*   **Commit Messages:** Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) format:
    *   `feat(volunteers): add file upload support`
    *   `fix(auth): resolve token refresh loop`

---

## 📄 License

This repository is proprietary. All rights reserved by the Maatram Foundation.