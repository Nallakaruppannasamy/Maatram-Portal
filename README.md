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
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Lucide React |
| **Backend** | Node.js (v20 LTS), Express.js, TypeScript, Prisma ORM, Zod, Multer, Cloudinary SDK, Nodemailer |
| **Database** | PostgreSQL (Primary Store via Prisma) |
| **Testing** | Node.js / Express Integration Test Runner (`npm run test:complete`) |
| **Security** | Helmet, Rate Limiting (express-rate-limit), Bcryptjs, JWT Access/Refresh Token Rotation |

---

## 📁 Repository Structure

The project follows a **Feature-First Monorepo Monolith** architecture:

```
maatram/
├── client/                  # Frontend SPA application (Vite + React)
│   └── src/
│       ├── components/      # Shared UI components
│       ├── context/         # AuthContext provider
│       ├── features/        # Feature slices (auth, student, volunteer, etc.)
│       └── routes/          # Router definitions
├── server/                  # Backend API application (Express.js)
│   ├── prisma/              # Prisma schema & migration definitions
│   └── src/
│       ├── common/          # Middleware, custom exceptions, responses, guards
│       ├── config/          # Environment & service configurations
│       ├── modules/         # Business domain modules (auth, student, volunteer, etc.)
│       ├── tests/           # Backend integration test suite
│       └── utils/           # Utilities (audit, jwt, password, query helpers)
└── README.md                # Project documentation
```

---

## 💻 Local Development Setup

### Prerequisites

*   **Node.js** (v18 LTS or higher)
*   **PostgreSQL Database**

### Setup Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/maatram-foundation/svms.git
    cd svms
    ```

2.  **Install Dependencies:**
    ```bash
    # Install dependencies for client and server
    cd server && npm install
    cd ../client && npm install
    ```

3.  **Environment Configuration:**
    Configure environment variables for the server service (`server/.env`).
    ```env
    PORT=5000
    DATABASE_URL="postgresql://user:password@localhost:5432/maatram_db?schema=public"
    DIRECT_URL="postgresql://user:password@localhost:5432/maatram_db?schema=public"
    JWT_ACCESS_SECRET="your-access-secret"
    JWT_REFRESH_SECRET="your-refresh-secret"
    CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
    CLOUDINARY_API_KEY="your-cloudinary-key"
    CLOUDINARY_API_SECRET="your-cloudinary-secret"
    SMTP_USER="smtp-user"
    SMTP_PASS="smtp-pass"
    ```

4.  **Initialize Database:**
    Run migrations and seed the database with core organizational data and test user accounts.
    ```bash
    cd server
    npm run prisma:generate
    npm run prisma:migrate
    npm run prisma:seed
    ```

5.  **Start Backend Server:**
    ```bash
    cd server
    npm run dev
    ```

---

## 🧪 Testing

```bash
# Run complete backend integration suite
cd server && npm run test:complete
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