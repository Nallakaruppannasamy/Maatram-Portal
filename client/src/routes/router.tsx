import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/shared/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { ROLES } from '@/constants/roles'

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
import { ResumeViewerPage } from '@/features/resume/pages/ResumeViewerPage'

// Zone Incharge Portal Pages
import { ZoneDashboardPage } from '@/features/dashboard/pages/ZoneDashboardPage'
import { VolunteerApprovalPage } from '@/features/organization/incharge/VolunteerApprovalPage'
import { ZoneStudentManagementPage } from '@/features/organization/incharge/ZoneStudentManagementPage'
import { AssignedCollegesPage } from '@/features/organization/incharge/AssignedCollegesPage'
import { ZoneAnalyticsPage } from '@/features/analytics/pages/ZoneAnalyticsPage'
import { ZoneProfilePage } from '@/features/organization/incharge/ZoneProfilePage'
import { ZoneAuditLogsPage } from '@/features/organization/incharge/ZoneAuditLogsPage'

// Super Admin Portal Pages
import { SuperAdminDashboardPage } from '@/features/dashboard/pages/SuperAdminDashboardPage'
import { StudentProvisioningPage } from '@/features/organization/admin/StudentProvisioningPage'
import { SuperAdminStudentDirectoryPage } from '@/features/organization/admin/SuperAdminStudentDirectoryPage'
import { ArchivedStudentsPage } from '@/features/organization/admin/ArchivedStudentsPage'
import { ZoneManagementPage } from '@/features/organization/admin/ZoneManagementPage'
import { OrganizationHierarchyPage } from '@/features/organization/admin/OrganizationHierarchyPage'
import { TeamManagementPage } from '@/features/organization/admin/TeamManagementPage'
import { SuperAdminVolunteeringLogsPage } from '@/features/organization/admin/SuperAdminVolunteeringLogsPage'
import { SuperAdminAnalyticsPage } from '@/features/analytics/pages/SuperAdminAnalyticsPage'
import { AuditLogsPage } from '@/features/organization/pages/AuditLogsPage'

// Shared Tools
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage'

import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'

export const router = createBrowserRouter([
  // Public & Auth Routes (Without App Layout Sidebar)
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    path: '/change-password',
    element: (
      <ProtectedRoute>
        <ChangePasswordPage />
      </ProtectedRoute>
    ),
  },

  // Standalone Resume Viewer (no sidebar, opens in new tab for printing)
  {
    path: '/resume/:studentId',
    element: (
      <ProtectedRoute>
        <ResumeViewerPage />
      </ProtectedRoute>
    ),
  },

  // Authenticated Workspace Routes (Wrapped with ProtectedRoute & App Layout)
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      // Student Routes
      {
        path: '/student/dashboard',
        element: (
          <RoleGuard allowedRoles={[ROLES.STUDENT, ROLES.ZONE, ROLES.ADMIN]}>
            <StudentDashboardPage />
          </RoleGuard>
        ),
      },
      {
        path: '/student/profile',
        element: (
          <RoleGuard allowedRoles={[ROLES.STUDENT, ROLES.ZONE, ROLES.ADMIN]}>
            <StudentProfilePage />
          </RoleGuard>
        ),
      },
      {
        path: '/student/volunteer-submit',
        element: (
          <RoleGuard allowedRoles={[ROLES.STUDENT]}>
            <VolunteerSubmissionPage />
          </RoleGuard>
        ),
      },
      {
        path: '/student/volunteer-history',
        element: (
          <RoleGuard allowedRoles={[ROLES.STUDENT]}>
            <VolunteerHistoryPage />
          </RoleGuard>
        ),
      },
      {
        path: '/student/resume',
        element: (
          <RoleGuard allowedRoles={[ROLES.STUDENT, ROLES.ZONE, ROLES.ADMIN]}>
            <ResumeGeneratorPage />
          </RoleGuard>
        ),
      },

      // Zone Incharge Routes
      {
        path: '/zone/dashboard',
        element: (
          <RoleGuard allowedRoles={[ROLES.ZONE, ROLES.ADMIN]}>
            <ZoneDashboardPage />
          </RoleGuard>
        ),
      },
      {
        path: '/zone/approvals',
        element: (
          <RoleGuard allowedRoles={[ROLES.ZONE, ROLES.ADMIN]}>
            <VolunteerApprovalPage />
          </RoleGuard>
        ),
      },
      {
        path: '/zone/students',
        element: (
          <RoleGuard allowedRoles={[ROLES.ZONE, ROLES.ADMIN]}>
            <ZoneStudentManagementPage />
          </RoleGuard>
        ),
      },
      {
        path: '/zone/colleges',
        element: (
          <RoleGuard allowedRoles={[ROLES.ZONE, ROLES.ADMIN]}>
            <AssignedCollegesPage />
          </RoleGuard>
        ),
      },
      {
        path: '/zone/analytics',
        element: (
          <RoleGuard allowedRoles={[ROLES.ZONE, ROLES.ADMIN]}>
            <ZoneAnalyticsPage />
          </RoleGuard>
        ),
      },
      {
        path: '/zone/profile',
        element: (
          <RoleGuard allowedRoles={[ROLES.ZONE, ROLES.ADMIN]}>
            <ZoneProfilePage />
          </RoleGuard>
        ),
      },
      {
        path: '/zone/audit-logs',
        element: (
          <RoleGuard allowedRoles={[ROLES.ZONE]}>
            <ZoneAuditLogsPage />
          </RoleGuard>
        ),
      },

      // Super Admin Routes
      {
        path: '/admin/dashboard',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <SuperAdminDashboardPage />
          </RoleGuard>
        ),
      },
      {
        path: '/admin/provisioning',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <StudentProvisioningPage />
          </RoleGuard>
        ),
      },
      {
        path: '/admin/students',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <SuperAdminStudentDirectoryPage />
          </RoleGuard>
        ),
      },
      {
        path: '/admin/archived-students',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <ArchivedStudentsPage />
          </RoleGuard>
        ),
      },
      {
        path: '/admin/hierarchy',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <OrganizationHierarchyPage />
          </RoleGuard>
        ),
      },
      {
        path: '/admin/zones',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <ZoneManagementPage />
          </RoleGuard>
        ),
      },
      {
        path: '/admin/team',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <TeamManagementPage />
          </RoleGuard>
        ),
      },
      {
        path: '/admin/volunteering-logs',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <SuperAdminVolunteeringLogsPage />
          </RoleGuard>
        ),
      },
      {
        path: '/admin/analytics',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <SuperAdminAnalyticsPage />
          </RoleGuard>
        ),
      },
      {
        path: '/admin/audit-logs',
        element: (
          <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <AuditLogsPage />
          </RoleGuard>
        ),
      },

      // Shared System Tools
      {
        path: '/notifications',
        element: (
          <RoleGuard allowedRoles={[ROLES.STUDENT, ROLES.ZONE, ROLES.ADMIN]}>
            <NotificationsPage />
          </RoleGuard>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
