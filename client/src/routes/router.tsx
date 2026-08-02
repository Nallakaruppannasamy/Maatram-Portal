import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/shared/AppLayout'

// Auth & Public Pages
import { LandingPage } from '@/features/auth/pages/LandingPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ChangePasswordPage } from '@/features/auth/pages/ChangePasswordPage'

// Student Portal Pages
import { StudentDashboardPage } from '@/features/dashboard/pages/StudentDashboardPage'
import { StudentProfilePage } from '@/features/student/pages/StudentProfilePage'
import { VolunteerSubmissionPage } from '@/features/student/pages/VolunteerSubmissionPage'
import { VolunteerHistoryPage } from '@/features/student/pages/VolunteerHistoryPage'

// Resume Generator
import { ResumeGeneratorPage } from '@/features/resume/pages/ResumeGeneratorPage'

// Zone Incharge Portal Pages
import { ZoneDashboardPage } from '@/features/dashboard/pages/ZoneDashboardPage'
import { VolunteerApprovalPage } from '@/features/organization/incharge/VolunteerApprovalPage'
import { ZoneStudentManagementPage } from '@/features/organization/incharge/ZoneStudentManagementPage'
import { ZoneManagementPage } from '@/features/organization/admin/ZoneManagementPage'
import { ZoneAnalyticsPage } from '@/features/analytics/pages/ZoneAnalyticsPage'
import { ZoneProfilePage } from '@/features/organization/incharge/ZoneProfilePage'

// Super Admin Portal Pages
import { SuperAdminDashboardPage } from '@/features/dashboard/pages/SuperAdminDashboardPage'
import { StudentProvisioningPage } from '@/features/organization/admin/StudentProvisioningPage'
import { SuperAdminStudentDirectoryPage } from '@/features/organization/admin/SuperAdminStudentDirectoryPage'
import { OrganizationHierarchyPage } from '@/features/organization/admin/OrganizationHierarchyPage'
import { TeamManagementPage } from '@/features/organization/admin/TeamManagementPage'
import { SuperAdminAnalyticsPage } from '@/features/analytics/pages/SuperAdminAnalyticsPage'
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
