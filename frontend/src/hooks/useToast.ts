/**
 * useToast Hook - 2025 Design System
 * Requirements: 7.4
 *
 * Toast state management with:
 * - addToast, removeToast functions
 * - Auto-dismiss timer handling
 * - Unique ID generation
 */

import { useState, useCallback } from 'react'
import type { ToastData } from '@/components/ui/Toast'

let toastIdCounter = 0

function generateToastId(): string {
  return `toast-${Date.now()}-${++toastIdCounter}`
}

export interface UseToastReturn {
  toasts: ToastData[]
  addToast: (toast: Omit<ToastData, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
  // Convenience methods
  success: (title: string, message?: string) => string
  error: (title: string, message?: string) => string
  info: (title: string, message?: string) => string
  warning: (title: string, message?: string) => string
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((toast: Omit<ToastData, 'id'>): string => {
    const id = generateToastId()
    const newToast: ToastData = { ...toast, id }
    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods for common toast types
  const success = useCallback(
    (title: string, message?: string) =>
      addToast({ type: 'success', title, message }),
    [addToast]
  )

  const error = useCallback(
    (title: string, message?: string) =>
      addToast({ type: 'error', title, message }),
    [addToast]
  )

  const info = useCallback(
    (title: string, message?: string) =>
      addToast({ type: 'info', title, message }),
    [addToast]
  )

  const warning = useCallback(
    (title: string, message?: string) =>
      addToast({ type: 'warning', title, message }),
    [addToast]
  )

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    info,
    warning,
  }
}

// ============================================
// Global Toast Store (for use outside React)
// ============================================

type ToastListener = (toasts: ToastData[]) => void

class ToastStore {
  private toasts: ToastData[] = []
  private listeners: Set<ToastListener> = new Set()

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]))
  }

  add(toast: Omit<ToastData, 'id'>): string {
    const id = generateToastId()
    this.toasts = [...this.toasts, { ...toast, id }]
    this.notify()
    return id
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id)
    this.notify()
  }

  clear() {
    this.toasts = []
    this.notify()
  }

  getToasts(): ToastData[] {
    return [...this.toasts]
  }
}

export const toastStore = new ToastStore()

// Global toast functions for use outside React components
export const toast = {
  success: (title: string, message?: string) =>
    toastStore.add({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    toastStore.add({ type: 'error', title, message }),
  info: (title: string, message?: string) =>
    toastStore.add({ type: 'info', title, message }),
  warning: (title: string, message?: string) =>
    toastStore.add({ type: 'warning', title, message }),
  custom: (toast: Omit<ToastData, 'id'>) => toastStore.add(toast),
  dismiss: (id: string) => toastStore.remove(id),
  clear: () => toastStore.clear(),
}
