/**
 * SoundButton - Button with integrated sound feedback
 * 
 * Drop-in replacement for Button that adds hover/click sounds.
 * Uses the existing Button component with sound integration.
 * 
 * Usage:
 * <SoundButton variant="primary" onClick={handleClick}>
 *   Click Me
 * </SoundButton>
 */

import { forwardRef, type MouseEvent } from 'react'
import { Button, type ButtonProps } from './Button'
import { useUISound } from '@/hooks/useUISound'

export interface SoundButtonProps extends ButtonProps {
  /** Disable sound effects */
  noSound?: boolean
  /** Play success sound instead of click on action */
  successSound?: boolean
}

export const SoundButton = forwardRef<HTMLButtonElement, SoundButtonProps>(
  ({ noSound = false, successSound = false, onClick, onMouseEnter, ...props }, ref) => {
    const { playHover, playClick, playSuccess } = useUISound({ disabled: noSound })

    const handleMouseEnter = (e: MouseEvent<HTMLButtonElement>) => {
      playHover()
      onMouseEnter?.(e)
    }

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (successSound) {
        playSuccess()
      } else {
        playClick()
      }
      onClick?.(e)
    }

    return (
      <Button
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        {...props}
      />
    )
  }
)

SoundButton.displayName = 'SoundButton'
