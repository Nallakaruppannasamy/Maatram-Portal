import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'lg',
}: ModalProps) => {
  if (!isOpen) return null

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={cn(
          'w-full bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[90vh]',
          widths[maxWidth]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            {title && <h3 className="text-lg font-bold text-[#111827]">{title}</h3>}
            {description && <p className="text-xs text-[#45464c] mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#76777d] hover:text-[#111827] hover:bg-[#F0EDEE] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#FCF8FA] border-t border-[#E5E7EB]">{footer}</div>}
      </div>
    </div>
  )
}
