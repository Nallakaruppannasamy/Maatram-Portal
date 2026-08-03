import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen w-full bg-[#FCF8FA] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-2">Something went wrong</h2>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              An unexpected application error occurred. Please refresh the page or contact system support.
            </p>
            {this.state.error && (
              <div className="bg-gray-50 rounded-xl p-3 mb-6 text-left border border-gray-200 overflow-x-auto max-h-32">
                <code className="text-[11px] text-rose-600 font-mono">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            <Button
              onClick={this.handleReload}
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
