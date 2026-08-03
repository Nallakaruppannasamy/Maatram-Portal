# Maatram Foundation Student & Volunteer Management System (SVMS) — Frontend

Standardized, responsive, enterprise-grade React Single Page Application (SPA) built for the Maatram Foundation Student & Volunteer Management System.

---

## 🛠️ Technology Stack & Architecture

- **Core Framework**: React 18 + TypeScript + Vite
- **Styling**: Vanilla Tailwind CSS + Lucide React Icons
- **State & Server Query Management**: `@tanstack/react-query` v5
- **HTTP Client**: Centralized Axios Instance (`src/api/axios.ts`) with Bearer token injection & automatic 401 token refresh queue
- **Routing**: React Router v6 (`createBrowserRouter`) with `ProtectedRoute` & `RoleGuard` RBAC
- **UI Feedback & Toasts**: `react-toastify` via centralized `notify` wrapper (`src/utils/toast.ts`)

---

## 📁 Directory Structure

```
client/
├── public/                # Static public assets & logos
├── src/
│   ├── api/               # Modular API clients (auth, organization, zone, user, profile, student, volunteer)
│   ├── assets/            # Brand imagery, SVGs, logos
│   ├── components/        # Reusable UI components & Layouts
│   │   ├── auth/          # ProtectedRoute & RoleGuard
│   │   ├── shared/        # AppLayout, Header, Sidebar, ErrorBoundary
│   │   └── ui/            # Button, Card, Input, Modal, Badge, Loading Skeletons
│   ├── constants/         # Role enums, route definitions, API endpoints, status codes
│   ├── context/           # AuthContext provider & authentication state
│   ├── features/          # Feature-based pages & portal modules
│   │   ├── analytics/     # Zone & Super Admin Analytics
│   │   ├── auth/          # Landing, Login, ForgotPassword, ChangePassword, ResetPassword
│   │   ├── dashboard/     # Student, Zone, and Super Admin Dashboards
│   │   ├── notifications/ # Notification Center
│   │   ├── organization/  # Hierarchy, Provisioning, Directory, Team, Zone Management
│   │   ├── reports/       # On-demand CSV report exports
│   │   ├── resume/        # QR-Verified Student Resume Generator
│   │   └── student/       # Student Profile, Volunteer Submission, Volunteer History
│   ├── hooks/             # Custom hooks (useAuth, useApi, usePagination, useDebounce)
│   ├── providers/         # AppProviders & React Query Provider
│   ├── routes/            # React Router v6 browser router definitions
│   ├── types/             # Shared TypeScript API interfaces & types
│   ├── utils/             # Local storage token utilities & toast helpers
│   ├── App.tsx            # Root application element
│   └── main.tsx           # Entry DOM renderer
├── .env.example           # Environment template
├── .env                   # Local environment config
├── index.html             # HTML entry template
├── package.json           # Dependencies & scripts
└── vite.config.ts         # Vite bundler configuration
```

---

## 🔐 Environment Configuration

Create a `.env` file in the `client/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 🚀 Available Scripts

In the `client/` directory, you can run:

### `npm run dev`
Runs the application in development mode with HMR on `http://localhost:5173`.

### `npm run build`
Compiles TypeScript and builds the production bundle into the `dist/` directory using Vite.

### `npx tsc --noEmit`
Runs strict TypeScript type-checking without emitting files.

---

## 🔑 Default Seeded Database Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `logesh090707@gmail.com` | `Student@123` |
| **Zone Incharge** | `ramesh.kumar@zone1.maatram.org` | `Zone@123` |
| **Super Admin** | `admin@maatram.com` | `admin@123` |
| **Super Admin (Primary)** | `arun.s@maatram.org` | `AdminPassword@123` |

See [CREDENTIALS.md](../CREDENTIALS.md) for full details.

---

## 🛡️ Role-Based Access Control (RBAC)

The frontend enforces strict role isolation across three user tiers:
1. `'student'` — Student Portal (`/student/*`)
2. `'zone'` — Zone Incharge Portal (`/zone/*`)
3. `'admin'` — Super Admin Executive Portal (`/admin/*`)

Unauthenticated users are automatically redirected to `/login`. First-time logins (`isFirstLogin: true`) are enforced to update temporary system passwords at `/change-password` before dashboard access is permitted.
