import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Status or color style variant */
  variant?:
    | 'approved'
    | 'pending'
    | 'rejected'
    | 'revision'
    | 'gold'
    | 'neutral'
    | 'info'
  /** Badge size preset */
  size?: 'sm' | 'md'
  /** Shows colored status dot indicator */
  showDot?: boolean
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'neutral',
      size = 'md',
      showDot = true,
      children,
      ...props
    },
    ref
  ) => {
    // Variant background, text, and border styling
    const variants = {
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      pending: 'bg-amber-50 text-amber-700 border-amber-200/80',
      rejected: 'bg-rose-50 text-rose-700 border-rose-200/80',
      revision: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      gold: 'bg-[#FED65B]/20 text-[#745c00] border-[#FED65B]/60 font-semibold',
      neutral: 'bg-gray-100 text-gray-700 border-gray-200',
      info: 'bg-sky-50 text-sky-700 border-sky-200/80',
    }

    // Status dot color mapping
    const dots = {
      approved: 'bg-emerald-500',
      pending: 'bg-amber-500',
      rejected: 'bg-rose-500',
      revision: 'bg-indigo-500',
      gold: 'bg-[#D4AF37]',
      neutral: 'bg-gray-400',
      info: 'bg-sky-500',
    }

    // Size presets
    const sizes = {
      sm: 'text-[10px] px-2 py-0.5 font-medium rounded-full',
      md: 'text-xs px-2.5 py-1 font-semibold rounded-full',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 border border-solid tracking-wide transition-colors shrink-0',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {showDot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full shrink-0', dots[variant])}
          />
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge