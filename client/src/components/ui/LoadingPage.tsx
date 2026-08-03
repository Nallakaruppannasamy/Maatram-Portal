import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'

interface LoadingPageProps {
  message?: string
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ message = 'Loading application...' }) => {
  return (
    <div className="min-h-screen w-full bg-[#FCF8FA] flex flex-col items-center justify-center p-6">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm font-medium text-[#111827] animate-pulse">{message}</p>
    </div>
  )
}

export default LoadingPage
