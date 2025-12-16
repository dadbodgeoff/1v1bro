/**
 * PanelHeader - Consistent header component for analytics panels
 * 
 * Requirements: 4.4 - Display consistent header with panel name, description, and quick actions
 */

import type { ReactNode } from 'react'

export interface PanelHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  badge?: string
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

export function PanelHeader({ 
  title, 
  description, 
  actions,
  badge,
  badgeVariant = 'default',
}: PanelHeaderProps) {
  const badgeColors = {
    default: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white truncate">{title}</h2>
          {badge && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${badgeColors[badgeVariant]}`}>
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}

/**
 * ActionButton - Consistent button style for panel header actions
 */
export interface ActionButtonProps {
  onClick: () => void
  children: ReactNode
  variant?: 'default' | 'primary' | 'danger'
  disabled?: boolean
  loading?: boolean
}

export function ActionButton({ 
  onClick, 
  children, 
  variant = 'default',
  disabled = false,
  loading = false,
}: ActionButtonProps) {
  const variantClasses = {
    default: 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300',
    primary: 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/30 text-orange-400',
    danger: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-400',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
      `.trim()}
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
