import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3.5 text-[#76777d] pointer-events-none">{icon}</div>}
          <input
            ref={ref}
            id={id}
            type={type}
            className={cn(
              'w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] placeholder-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all duration-200',
              icon && 'pl-10',
              error && 'border-[#BA1A1A] focus:ring-red-200 focus:border-[#BA1A1A]',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[#BA1A1A] mt-1">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
