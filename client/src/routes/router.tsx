import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/shared/AppLayout'

// Auth & Public Pages
import { LandingPage } from '@/features/auth/pages/LandingPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ChangePasswordPage } from '@/features/auth/pages/ChangePasswordPage'

// Student Portal Pages
import { StudentDashboardPage } from '@/features/student/pages/StudentDashboardPage'
import { StudentProfilePage } from '@/features/student/pages/StudentProfilePage'
import { VolunteerSubmissionPage } from '@/features/student/pages/VolunteerSubmissionPage'
import { VolunteerHistoryPage } from '@/features/student/pages/VolunteerHistoryPage'

// Resume Generator
import { ResumeGeneratorPage } from '@/features/resume/pages/ResumeGeneratorPage'

// Zone Incharge Portal Pages
import { ZoneDashboardPage } from '@/features/organization/pages/ZoneDashboardPage'
import { VolunteerApprovalPage } from '@/features/organization/pages/VolunteerApprovalPage'
import { ZoneStudentManagementPage } from '@/features/organization/pages/ZoneStudentManagementPage'
import { ZoneManagementPage } from '@/features/organization/pages/ZoneManagementPage'
import { ZoneAnalyticsPage } from '@/features/organization/pages/ZoneAnalyticsPage'
import { ZoneProfilePage } from '@/features/organization/pages/ZoneProfilePage'

// Super Admin Portal Pages
import { SuperAdminDashboardPage } from '@/features/organization/pages/SuperAdminDashboardPage'
import { StudentProvisioningPage } from '@/features/organization/pages/StudentProvisioningPage'
import { SuperAdminStudentDirectoryPage } from '@/features/organization/pages/SuperAdminStudentDirectoryPage'
import { OrganizationHierarchyPage } from '@/features/organization/pages/OrganizationHierarchyPage'
import { TeamManagementPage } from '@/features/organization/pages/TeamManagementPage'
import { SuperAdminAnalyticsPage } from '@/features/organization/pages/SuperAdminAnalyticsPage'
import { AuditLogsPage } from '@/features/organization/pages/AuditLogsPage'

// Shared Tools
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'

export const router = createBrowserRouter([
  // Public & Auth Routes (Without App Layout Sidebar)
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/change-password', element: <ChangePasswordPage /> },

  // Authenticated Workspace Routes (Wrapped with App Layout)
  {
    element: <AppLayout />,
    children: [
      // Student Routes
      { path: '/student/dashboard', element: <StudentDashboardPage /> },
      { path: '/student/profile', element: <StudentProfilePage /> },
      { path: '/student/volunteer-submit', element: <VolunteerSubmissionPage /> },
      { path: '/student/volunteer-history', element: <VolunteerHistoryPage /> },
      { path: '/student/resume', element: <ResumeGeneratorPage /> },

      // Zone Incharge Routes
      { path: '/zone/dashboard', element: <ZoneDashboardPage /> },
      { path: '/zone/approvals', element: <VolunteerApprovalPage /> },
      { path: '/zone/students', element: <ZoneStudentManagementPage /> },
      { path: '/zone/colleges', element: <ZoneManagementPage /> },
      { path: '/zone/analytics', element: <ZoneAnalyticsPage /> },
      { path: '/zone/profile', element: <ZoneProfilePage /> },

      // Super Admin Routes
      { path: '/admin/dashboard', element: <SuperAdminDashboardPage /> },
      { path: '/admin/provisioning', element: <StudentProvisioningPage /> },
      { path: '/admin/students', element: <SuperAdminStudentDirectoryPage /> },
      { path: '/admin/hierarchy', element: <OrganizationHierarchyPage /> },
      { path: '/admin/team', element: <TeamManagementPage /> },
      { path: '/admin/analytics', element: <SuperAdminAnalyticsPage /> },
      { path: '/admin/audit-logs', element: <AuditLogsPage /> },

      // Shared System Tools
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/reports', element: <ReportsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
