/**
 * Toast Component - 2025 Design System
 * Requirements: 7.4
 *
 * Toast notification system with:
 * - Type variants (success, error, info, warning)
 * - Slide-in animation from top-right
 * - Auto-dismiss with configurable duration
 * - Manual dismiss with X button
 * - Stack multiple toasts with 8px gap
 */

import { useEffect, useState } from 'react'
import { cn } from '@/utils/helpers'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastData {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number // ms, default 3000
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

const typeStyles: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: 'bg-[#10b981]/10',
    icon: '✓',
    border: 'border-[#10b981]/30',
  },
  error: {
    bg: 'bg-[#f43f5e]/10',
    icon: '✕',
    border: 'border-[#f43f5e]/30',
  },
  info: {
    bg: 'bg-[#3b82f6]/10',
    icon: 'ℹ',
    border: 'border-[#3b82f6]/30',
  },
  warning: {
    bg: 'bg-[#f59e0b]/10',
    icon: '⚠',
    border: 'border-[#f59e0b]/30',
  },
}

const iconColors: Record<ToastType, string> = {
  success: 'text-[#10b981]',
  error: 'text-[#f43f5e]',
  info: 'text-[#3b82f6]',
  warning: 'text-[#f59e0b]',
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)
  const styles = typeStyles[toast.type]

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => onDismiss(toast.id), 200)
  }

  useEffect(() => {
    const duration = toast.duration ?? 3000
    if (duration > 0) {
      const timer = setTimeout(handleDismiss, duration)
      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm',
        'min-w-[320px] max-w-[420px] shadow-lg',
        styles.bg,
        styles.border,
        isExiting ? 'animate-toast-out' : 'animate-toast-in'
      )}
      style={{
        animation: isExiting
          ? 'toastSlideOut 200ms ease-out forwards'
          : 'toastSlideIn 300ms ease-out forwards',
      }}
    >
      {/* Icon */}
      <span
        className={cn(
          'flex-shrink-0 w-5 h-5 flex items-center justify-center text-sm font-bold',
          iconColors[toast.type]
        )}
      >
        {styles.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm text-[#a3a3a3]">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium text-[#6366f1] hover:text-[#4f46e5] transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-md text-[#737373] hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}

/**
 * ToastContainer - Accessible notification container
 * 
 * **Feature: ui-polish-8-of-10**
 * **Validates: Requirements 3.5**
 * 
 * Uses aria-live="polite" region to announce toast notifications
 * to screen readers without interrupting current speech.
 */
export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-[var(--z-toast)] flex flex-col gap-2 pointer-events-none safe-area-top safe-area-right"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}
