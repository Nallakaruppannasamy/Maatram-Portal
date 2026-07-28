import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', icon, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none'

    const variants = {
      primary: 'bg-[#111827] text-white hover:bg-slate-800 focus:ring-slate-900 shadow-sm',
      gold: 'bg-[#D4AF37] text-white hover:bg-[#c4a02e] focus:ring-[#D4AF37] shadow-sm font-semibold',
      secondary: 'bg-[#F0EDEE] text-[#111827] hover:bg-[#E5E2E3] focus:ring-slate-300',
      outline: 'border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#FCF8FA] focus:ring-slate-400 luxury-shadow',
      ghost: 'text-[#45464c] hover:bg-[#F0EDEE] hover:text-[#111827]',
      danger: 'bg-[#BA1A1A] text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
    }

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
