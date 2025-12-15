/**
 * PauseOverlay - Game paused screen
 */

import { memo } from 'react'
import {
  OverlayContainer,
  EnterpriseCard,
  EnterpriseTitle,
  EnterpriseButton,
} from '../EnterpriseOverlays'

interface PauseOverlayProps {
  onResume: () => void
  onRestart: () => void
  onQuit: () => void
}

export const PauseOverlay = memo(({
  onResume,
  onRestart,
  onQuit,
}: PauseOverlayProps) => {
  return (
    <OverlayContainer blur="sm" darkness={50}>
      <EnterpriseCard maxWidth="sm" glow="none">
        <EnterpriseTitle size="xl">PAUSED</EnterpriseTitle>
        <p className="text-gray-400 text-center mb-6">Press ESC or click Resume to continue</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <EnterpriseButton onClick={onResume} variant="primary">
            ▶ Resume
          </EnterpriseButton>
          <EnterpriseButton onClick={onRestart} variant="secondary" shortcut="R">
            Restart
          </EnterpriseButton>
          <EnterpriseButton onClick={onQuit} variant="ghost">
            Quit
          </EnterpriseButton>
        </div>
      </EnterpriseCard>
    </OverlayContainer>
  )
})
PauseOverlay.displayName = 'PauseOverlay'
