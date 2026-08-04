# Maatram Portal - Backend Core

> Robust, TypeScript-driven REST API powering the Maatram Foundation Student & Volunteer Management Portal. Built on **Express.js**, **Prisma ORM**, **Supabase PostgreSQL**, and **TypeScript**.

---

## 🚀 Key Features

* **Secure Authentication & RBAC**: Password-based JWT authentication, Refresh Token Rotation, custom token revocation, and strict Role-Based Access Control (Admin, Staff, Student, Volunteer).
* **Administrative Provisioning**: Programmatic onboarding of Zone Managers and Staff with forced initial password change and forgot-password reset flows.
* **Student Management**: State-machine status workflow (`ACTIVE`, `SUSPENDED`, `ALUMNI`, etc.), administrative suspension cascade, and direct CSV/XLSX reporting exports.
* **Transactional Student CSV Importing**: Safe bulk parsing of student lists, checking reference keys (Organizations, Zones, Colleges, Departments, and Programs) with complete transactional rollback on row failures.
* **Volunteer Management**: Tracking profile records, skills mapping, and active availability states (`ACTIVE`, `ON_LEAVE`, `INACTIVE`) with state machine constraints.
* **Audit Logging**: Comprehensive, non-nullable log entries capturing the actor role, actions, entity identifiers, and audit labels.
* **Security & Clean Architecture**: Integrated SQL injection prevention, strict request validation via Zod schemas, global exception handling, and Winston/Morgan structured logging.

---

## 🛠️ Technology Stack

* **Runtime**: Node.js & TypeScript (`ts-node`, `tsc`)
* **Framework**: Express.js
* **Database & ORM**: Supabase PostgreSQL + Prisma ORM
* **Validation**: Zod (Request schemas, headers, query parameters)
* **Encryption**: Bcryptjs (secure password hashes) & JsonWebToken (Access & Refresh tokens)
* **Media Handling**: Multer & Cloudinary SDK integration
* **Utilities**: Winston (Structured Logger), Morgan (HTTP Access Logs)

---

## 📋 Prerequisites

Before running the server locally, ensure you have the following installed:

1. **Node.js** (v18 or higher recommended)
2. **PostgreSQL** database (Local instance or Supabase cloud instance connection string)
3. **Cloudinary account** (For media/resume upload services)

---

## ⚙️ Installation & Local Setup

### 1. Clone & Install Dependencies
Navigate to the server directory and install npm packages:
```bash
cd Maatram-Portal/server
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root of the `server/` directory:
```bash
cp .env.example .env
```
Fill in the database connections and credentials:
```env
PORT=4500
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db>?schema=public"
JWT_ACCESS_SECRET="your-super-secret-access-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. Database Schema Setup & Sync
Generate the Prisma client and run database migrations to create tables:
```bash
# Generate Prisma Client
npm run prisma:generate

# Run DB Migrations
npm run prisma:migrate
```

### 4. Database Seeding
Populate the database with pre-configured static lookups (Colleges, Departments, Programs) and the default Admin account:
```bash
npm run prisma:seed
```
* **Default Admin Username**: `admin@maatram.org`
* **Default Admin Password**: `AdminPassword@123`

---

## 🏃 Running the Application

### Development Mode (with Hot Reloading)
Launches the server in development mode using `nodemon` and auto-restarts on save:
```bash
npm run dev
```
The API will be accessible by default at: `http://localhost:4500/api/v1`

### Production Build & Execution
Compile TypeScript code to JavaScript and run the production server:
```bash
# Build the application
npm run build

# Start the compiled server
npm run start
```

---

## 🧪 Running Integration Tests

Comprehensive programmatic integration test runners are included to verify all modules and workflows:

```bash
# Run complete integration test suite
npm run test:complete

# Run Phase 8.2 Student Provisioning & Activation test suite
npm run test:phase8_2
```

---

## 📚 Documentation Reference

For deeper insights, consult the corresponding guides inside the `/docs` folder:

* [**API Reference** (docs/API.md)](docs/API.md) — Endpoint URLs, payloads, headers, query parameters, and RBAC requirements.
* [**Architecture & Modeling** (docs/ARCHITECTURE.md)](docs/ARCHITECTURE.md) — Layered code layout, state transition models, database entities, and lookup cascades.
* [**Production Deployment** (docs/DEPLOYMENT.md)](docs/DEPLOYMENT.md) — Cloud configuration steps, PM2 production setup, and security hardening tips.
