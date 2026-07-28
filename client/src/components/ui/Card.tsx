import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export const Card = ({ className, hoverable = false, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-white border border-[#E5E7EB] rounded-2xl luxury-shadow p-6 transition-all duration-200',
        hoverable && 'hover:shadow-md hover:border-[#D4AF37]/40 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props}>
    {children}
  </div>
)

export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-lg font-semibold text-[#111827] tracking-tight', className)} {...props}>
    {children}
  </h3>
)

export const CardDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-xs text-[#45464c]', className)} {...props}>
    {children}
  </p>
)

export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
)

export const CardFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center pt-4 mt-4 border-t border-[#E5E7EB]', className)} {...props}>
    {children}
  </div>
)
