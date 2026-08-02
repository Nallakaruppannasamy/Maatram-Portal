import React, { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional field label text */
  label?: string
  /** Validation error message */
  error?: string
  /** Secondary informational text below input (shown when no error) */
  helperText?: string
  /** Prefix icon element (rendered inside the left of the input) */
  icon?: React.ReactNode
  /** Suffix icon element (rendered inside the right of the input) */
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      icon,
      rightIcon,
      id,
      type = 'text',
      disabled,
      ...props
    },
    ref
  ) => {
    const autoId = useId()
    const inputId = id || autoId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const actualType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#111827] uppercase tracking-wider select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {/* Prefix Icon */}
          {icon && (
            <div className="absolute left-3.5 text-[#76777d] pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}

          {/* Main Input Element */}
          <input
            ref={ref}
            id={inputId}
            type={actualType}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              'w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] placeholder-[#76777d]',
              'focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]',
              'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
              'transition-all duration-200',
              icon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10',
              error && 'border-[#BA1A1A] focus:ring-red-200 focus:border-[#BA1A1A]',
              className
            )}
            {...props}
          />

          {/* Right Icon / Password Toggle */}
          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={disabled}
              className="absolute right-3.5 text-[#76777d] hover:text-[#111827] focus:outline-none transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          ) : (
            rightIcon && (
              <div className="absolute right-3.5 text-[#76777d] pointer-events-none flex items-center justify-center">
                {rightIcon}
              </div>
            )
          )}
        </div>

        {/* Error or Helper Text */}
        {error ? (
          <p id={errorId} className="text-xs text-[#BA1A1A] mt-1 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-[#76777d] mt-1">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input