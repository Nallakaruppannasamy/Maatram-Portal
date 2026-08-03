import React from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { QueryProvider } from './QueryProvider'
import { AuthProvider } from '@/context/AuthContext'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          {children}
          <ToastContainer position="top-right" autoClose={4000} />
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}

export default AppProviders