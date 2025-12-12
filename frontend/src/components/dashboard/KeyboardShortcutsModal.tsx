/**
 * KeyboardShortcutsModal - Display all available keyboard shortcuts
 * 
 * Features:
 * - Group shortcuts by category (navigation, actions, general)
 * - Visual key caps for key combinations
 * - Close on Escape or click outside
 * 
 * Requirements: 9.6
 */

import { useEffect } from 'react'
import { useFocusTrap } from '@/hooks/useAccessibility'
import { DASHBOARD_SHORTCUTS, formatShortcut } from '@/hooks/useKeyboardShortcuts'
import { X, Keyboard } from 'lucide-react'

export interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Navigation',
  action: 'Actions',
  general: 'General',
}

const CATEGORY_ORDER = ['general', 'action', 'navigation'] as const

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Group shortcuts by category
  const groupedShortcuts = CATEGORY_ORDER.map(category => ({
    category,
    label: CATEGORY_LABELS[category],
    shortcuts: DASHBOARD_SHORTCUTS.filter(s => s.category === category),
  })).filter(g => g.shortcuts.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        role="dialog"
        aria-label="Keyboard shortcuts"
        aria-modal="true"
        className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto space-y-6">
          {groupedShortcuts.map(group => (
            <div key={group.category}>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map(shortcut => (
                  <div
                    key={shortcut.action}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-slate-300">{shortcut.description}</span>
                    <KeyCap shortcut={formatShortcut(shortcut)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 text-center">
          <span className="text-sm text-slate-400">
            Press <KeyCap shortcut="?" inline /> to toggle this modal
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * KeyCap - Visual key cap component
 */
function KeyCap({ shortcut, inline }: { shortcut: string; inline?: boolean }) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  
  // Split by + for non-Mac, or by individual characters for Mac symbols
  const keys = isMac
    ? shortcut.split('').filter(c => c.trim())
    : shortcut.split('+')

  return (
    <span className={`flex items-center gap-1 ${inline ? 'inline-flex' : ''}`}>
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="min-w-[24px] px-2 py-1 text-xs font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded shadow-sm text-center"
        >
          {key}
        </kbd>
      ))}
    </span>
  )
}
