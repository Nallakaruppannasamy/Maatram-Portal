import React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressBarProps {
  value: number // 0 - 100
  label?: string
  showPercentage?: boolean
  className?: string
  color?: 'gold' | 'primary' | 'emerald'
}

export const ProgressBar = ({
  value,
  label,
  showPercentage = true,
  className,
  color = 'gold',
}: ProgressBarProps) => {
  const clampedValue = Math.min(100, Math.max(0, value))

  const colors = {
    gold: 'bg-[#D4AF37]',
    primary: 'bg-[#111827]',
    emerald: 'bg-emerald-600',
  }

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-[#111827]">{label}</span>}
          {showPercentage && <span className="font-semibold text-[#45464c]">{Math.round(clampedValue)}%</span>}
        </div>
      )}
      <div className="w-full bg-[#F0EDEE] rounded-full h-2.5 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colors[color])}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  )
}
