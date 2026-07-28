import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'approved' | 'pending' | 'rejected' | 'gold' | 'neutral' | 'info'
  size?: 'sm' | 'md'
}

export const Badge = ({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}: BadgeProps) => {
  const variants = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    pending: 'bg-amber-50 text-amber-700 border-amber-200/60',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200/60',
    gold: 'bg-[#FED65B]/20 text-[#745c00] border-[#FED65B]/50 font-semibold',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200/60',
  }

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium rounded-full',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-full',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border border-solid tracking-wide',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
