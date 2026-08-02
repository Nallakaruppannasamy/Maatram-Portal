import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface ProgressBarProps {
  /** Numerical value between 0 and 100 */
  value: number
  /** Label text rendered above the progress bar */
  label?: string
  /** Whether to display the percentage badge on the right */
  showPercentage?: boolean
  /** Height size variant of the bar */
  size?: 'sm' | 'md' | 'lg'
  /** Palette theme color variant */
  color?: 'gold' | 'primary' | 'emerald' | 'danger'
  /** Render active animated shimmer state when value is indeterminate */
  indeterminate?: boolean
  /** Additional container wrapper styles */
  className?: string
  /** Custom color styling for the inner filled bar */
  barClassName?: string
}

const colorVariants = {
  gold: 'bg-[#D4AF37]',
  primary: 'bg-[#111827]',
  emerald: 'bg-emerald-600',
  danger: 'bg-[#BA1A1A]',
}

const sizeVariants = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercentage = true,
  size = 'md',
  color = 'gold',
  indeterminate = false,
  className,
  barClassName,
}) => {
  const labelId = useId()
  const clampedValue = Math.min(100, Math.max(0, value))
  const formattedPercent = Math.round(clampedValue)

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {/* Header Label & Percentage Badge */}
      {(label || (showPercentage && !indeterminate)) && (
        <div className="flex items-center justify-between text-xs">
          {label && (
            <span id={labelId} className="font-medium text-[#111827]">
              {label}
            </span>
          )}
          {showPercentage && !indeterminate && (
            <span className="font-semibold text-[#45464c] tabular-nums">
              {formattedPercent}%
            </span>
          )}
        </div>
      )}

      {/* Track & Bar Assembly */}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby={label ? labelId : undefined}
        aria-valuetext={
          indeterminate ? 'Loading...' : `${formattedPercent} percent`
        }
        className={cn(
          'w-full bg-[#F0EDEE] rounded-full overflow-hidden relative',
          sizeVariants[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colorVariants[color],
            indeterminate &&
              'w-full animate-pulse bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent',
            barClassName
          )}
          style={{ width: indeterminate ? '100%' : `${clampedValue}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar