import React, { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean
  /** Callback fired when closing via backdrop click, Escape key, or close button */
  onClose: () => void
  /** Optional modal header title */
  title?: string
  /** Optional secondary subtitle / description */
  description?: string
  /** Main body content */
  children: React.ReactNode
  /** Action bar / footer elements (e.g. Save / Cancel buttons) */
  footer?: React.ReactNode
  /** Width size variant */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Custom className for inner dialog container */
  className?: string
  /** Prevent closing when clicking outside the backdrop */
  closeOnBackdropClick?: boolean
}

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'lg',
  className,
  closeOnBackdropClick = true,
}) => {
  const titleId = useId()
  const descriptionId = useId()

  // Handle ESC key press & body scroll locking
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Lock body scroll
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose()
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'w-full bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200',
          widths[maxWidth],
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
            <div>
              {title && (
                <h3 id={titleId} className="text-lg font-bold text-[#111827]">
                  {title}
                </h3>
              )}
              {description && (
                <p id={descriptionId} className="text-xs text-[#45464c] mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1 text-[#76777d] hover:text-[#111827] hover:bg-[#F0EDEE] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#FCF8FA] border-t border-[#E5E7EB]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  // Render modal into body portal
  return createPortal(modalContent, document.body)
}

export default Modal