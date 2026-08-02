import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold'
  /** Button dimensions and padding */
  size?: 'sm' | 'md' | 'lg'
  /** Optional icon rendered before children */
  icon?: React.ReactNode
  /** Shows animated loader and disables button interactions */
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base layout, focus rings, and tactile active press animation
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]'

    // Color and theme variants aligned with Maatram Foundation styling
    const variants = {
      primary:
        'bg-[#111827] text-white hover:bg-slate-800 focus:ring-slate-900 shadow-sm',
      gold:
        'bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white hover:opacity-95 focus:ring-[#D4AF37] shadow-sm font-semibold hover:shadow-md hover:shadow-[#D4AF37]/20',
      secondary:
        'bg-[#F0EDEE] text-[#111827] hover:bg-[#E5E2E3] focus:ring-slate-300',
      outline:
        'border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#FCF8FA] hover:border-gray-300 focus:ring-slate-400 luxury-shadow',
      ghost:
        'text-[#45464c] hover:bg-[#F0EDEE] hover:text-[#111827]',
      danger:
        'bg-[#BA1A1A] text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
    }

    // Size presets
    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button