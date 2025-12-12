/**
 * CommandPalette - Global command palette for quick actions
 * 
 * Features:
 * - Search input with fuzzy filtering
 * - Recent actions, navigation, quick commands
 * - Keyboard shortcuts displayed
 * - Navigate/execute on Enter or click
 * - Close on Escape or click outside
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFocusTrap } from '@/hooks/useAccessibility'
import { formatShortcut, DASHBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts'
import {
  Search,
  Home,
  User,
  ShoppingBag,
  Package,
  Trophy,
  Gamepad2,
  Settings,
  LogOut,
  HelpCircle,
  Command,
} from 'lucide-react'

export interface CommandItem {
  id: string
  label: string
  shortcut?: string
  icon: React.ReactNode
  action: () => void
  category: 'navigation' | 'action' | 'recent'
  keywords?: string[]
}

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onFindMatch?: () => void
  onShowHelp?: () => void
  recentActions?: CommandItem[]
}

const CATEGORY_ORDER = ['recent', 'action', 'navigation'] as const
const CATEGORY_LABELS: Record<string, string> = {
  recent: 'Recent',
  action: 'Actions',
  navigation: 'Navigation',
}

export function CommandPalette({
  isOpen,
  onClose,
  onFindMatch,
  onShowHelp,
  recentActions = [],
}: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)

  // Build command list
  const commands = useMemo<CommandItem[]>(() => {
    const navCommands: CommandItem[] = [
      {
        id: 'nav-home',
        label: 'Go to Dashboard',
        shortcut: formatShortcut(DASHBOARD_SHORTCUTS.find(s => s.action === 'goToHome')!),
        icon: <Home className="w-4 h-4" />,
        action: () => { navigate('/dashboard'); onClose() },
        category: 'navigation',
        keywords: ['home', 'dashboard', 'main'],
      },
      {
        id: 'nav-profile',
        label: 'Go to Profile',
        shortcut: formatShortcut(DASHBOARD_SHORTCUTS.find(s => s.action === 'goToProfile')!),
        icon: <User className="w-4 h-4" />,
        action: () => { navigate('/profile'); onClose() },
        category: 'navigation',
        keywords: ['profile', 'account', 'stats'],
      },
      {
        id: 'nav-battlepass',
        label: 'Go to Battle Pass',
        shortcut: formatShortcut(DASHBOARD_SHORTCUTS.find(s => s.action === 'goToBattlePass')!),
        icon: <Trophy className="w-4 h-4" />,
        action: () => { navigate('/battlepass'); onClose() },
        category: 'navigation',
        keywords: ['battlepass', 'battle', 'pass', 'rewards', 'progression'],
      },
      {
        id: 'nav-shop',
        label: 'Go to Shop',
        shortcut: formatShortcut(DASHBOARD_SHORTCUTS.find(s => s.action === 'goToShop')!),
        icon: <ShoppingBag className="w-4 h-4" />,
        action: () => { navigate('/shop'); onClose() },
        category: 'navigation',
        keywords: ['shop', 'store', 'buy', 'purchase'],
      },
      {
        id: 'nav-inventory',
        label: 'Go to Inventory',
        shortcut: formatShortcut(DASHBOARD_SHORTCUTS.find(s => s.action === 'goToInventory')!),
        icon: <Package className="w-4 h-4" />,
        action: () => { navigate('/inventory'); onClose() },
        category: 'navigation',
        keywords: ['inventory', 'items', 'skins', 'cosmetics'],
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        icon: <Settings className="w-4 h-4" />,
        action: () => { navigate('/settings'); onClose() },
        category: 'navigation',
        keywords: ['settings', 'preferences', 'options'],
      },
    ]

    const actionCommands: CommandItem[] = [
      {
        id: 'action-findmatch',
        label: 'Find Match',
        shortcut: formatShortcut(DASHBOARD_SHORTCUTS.find(s => s.action === 'findMatch')!),
        icon: <Gamepad2 className="w-4 h-4" />,
        action: () => { onFindMatch?.(); onClose() },
        category: 'action',
        keywords: ['play', 'match', 'game', 'queue', 'find'],
      },
      {
        id: 'action-help',
        label: 'Keyboard Shortcuts',
        shortcut: '?',
        icon: <HelpCircle className="w-4 h-4" />,
        action: () => { onShowHelp?.(); onClose() },
        category: 'action',
        keywords: ['help', 'shortcuts', 'keyboard', 'keys'],
      },
      {
        id: 'action-logout',
        label: 'Sign Out',
        icon: <LogOut className="w-4 h-4" />,
        action: () => { navigate('/logout'); onClose() },
        category: 'action',
        keywords: ['logout', 'signout', 'sign out', 'exit'],
      },
    ]

    return [...recentActions, ...actionCommands, ...navCommands]
  }, [navigate, onClose, onFindMatch, onShowHelp, recentActions])

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands

    const lowerQuery = query.toLowerCase()
    return commands.filter(cmd => {
      const labelMatch = cmd.label.toLowerCase().includes(lowerQuery)
      const keywordMatch = cmd.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
      return labelMatch || keywordMatch
    }).sort((a, b) => {
      // Sort by match position (earlier matches first)
      const aPos = a.label.toLowerCase().indexOf(lowerQuery)
      const bPos = b.label.toLowerCase().indexOf(lowerQuery)
      if (aPos !== -1 && bPos !== -1) return aPos - bPos
      if (aPos !== -1) return -1
      if (bPos !== -1) return 1
      return 0
    })
  }, [commands, query])

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    for (const cmd of filteredCommands) {
      if (!groups[cmd.category]) groups[cmd.category] = []
      groups[cmd.category].push(cmd)
    }
    return CATEGORY_ORDER
      .filter(cat => groups[cat]?.length > 0)
      .map(cat => ({ category: cat, label: CATEGORY_LABELS[cat], items: groups[cat] }))
  }, [filteredCommands])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
        }
        break
    }
  }, [filteredCommands, selectedIndex, onClose])

  if (!isOpen) return null

  let globalIndex = -1

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm">
      <div
        ref={containerRef}
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        className="w-full max-w-lg bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <Command className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
            aria-label="Search commands"
          />
          <kbd className="px-2 py-1 text-xs text-slate-400 bg-slate-700 rounded">Esc</kbd>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto" role="listbox" aria-label="Commands">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
            </div>
          ) : (
            groupedCommands.map(group => (
              <div key={group.category} role="group" aria-label={group.label}>
                <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-800/50">
                  {group.label}
                </div>
                {group.items.map(cmd => {
                  globalIndex++
                  const isSelected = globalIndex === selectedIndex
                  const currentIndex = globalIndex
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => cmd.action()}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                        isSelected ? 'bg-indigo-500/20 text-white' : 'text-slate-300 hover:bg-slate-700/50'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className={isSelected ? 'text-indigo-400' : 'text-slate-400'}>
                        {cmd.icon}
                      </span>
                      <span className="flex-1">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="px-2 py-0.5 text-xs text-slate-400 bg-slate-700 rounded">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-slate-700 text-xs text-slate-400 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↵</kbd> select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}
