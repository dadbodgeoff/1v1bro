/**
 * GuestModeIndicator - Subtle guest mode indicator during gameplay
 * 
 * Shows a small indicator that the user is playing as a guest,
 * with an optional one-click signup button.
 * 
 * @module components/game/GuestModeIndicator
 * Requirements: 3.4
 */

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/helpers'
import { type GuestIndicatorConfig } from '@/game/guest/SoftConversionPrompts'

export interface GuestModeIndicatorProps {
  /** Indicator configuration */
  config: GuestIndicatorConfig
  /** Position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Additional CSS classes */
  className?: string
}

/**
 * GuestModeIndicator component
 */
export function GuestModeIndicator({
  config,
  position = 'top-left',
  className,
}: GuestModeIndicatorProps) {
  const navigate = useNavigate()

  // Handle signup click
  const handleSignup = useCallback(() => {
    navigate('/register')
  }, [navigate])

  if (!config.visible) return null

  // Position classes
  const positionClasses = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className={cn(
        'fixed z-40',
        positionClasses[position],
        className
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'bg-black/60 backdrop-blur-sm border border-white/10',
          'text-xs'
        )}
      >
        {/* Guest indicator dot - static, no animation */}
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
        
        {/* Message */}
        <span className="text-neutral-500">
          {config.message}
        </span>

        {/* Signup button */}
        {config.showSignupButton && (
          <button
            onClick={handleSignup}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium',
              'bg-[#F97316] text-white',
              'hover:bg-[#FB923C] transition-all',
              'min-h-[28px] min-w-[44px]' // Touch target compliance
            )}
          >
            Sign Up
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default GuestModeIndicator
