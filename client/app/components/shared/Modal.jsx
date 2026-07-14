'use client'

import { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

/**
 * Shared modal shell — centralizes what every ad hoc modal in this codebase
 * used to reimplement slightly differently (backdrop, centering, max-height
 * scroll) and adds Escape-key close, which none of them had.
 *
 * `variant="card"` (default) renders the standard white rounded panel with
 * an optional gradient header (title/subtitle/icon + close button) and
 * optional footer bar — used by PasswordModal/RescheduleModal/OnlineConfigModal.
 *
 * `variant="bare"` only provides the fixed backdrop + Escape/backdrop-click
 * handling; the caller's `children` render unstyled — used by ImageCropper/
 * ImageViewer, which have their own full-bleed dark overlay content.
 */
export default function Modal({
  isOpen = true,
  onClose,
  title,
  subtitle,
  icon: Icon,
  size = 'md',
  closeOnBackdrop = true,
  footer,
  children,
  bodyClassName,
  variant = 'card',
  backdropClassName,
}) {
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  if (variant === 'bare') {
    return (
      <div
        className={backdropClassName || 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80'}
        onClick={closeOnBackdrop ? onClose : undefined}
      >
        <div className={bodyClassName} onClick={e => e.stopPropagation()}>{children}</div>
      </div>
    )
  }

  return (
    <div
      className={backdropClassName || 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${SIZES[size]} max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="bg-gradient-primary p-4 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {Icon && <Icon className="h-5 w-5 text-white shrink-0" />}
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-white truncate">{title}</h3>
                {subtitle && <p className="text-xs text-white/80 truncate">{subtitle}</p>}
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors shrink-0">
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className={`overflow-y-auto ${bodyClassName || 'p-5'}`}>
          {children}
        </div>
        {footer && (
          <div className="border-t border-gray-200 p-4 flex gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
