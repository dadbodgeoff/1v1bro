/**
 * GameOverOverlay - Game over screen with stats
 * 
 * Enterprise-grade component following brand guidelines:
 * - No hardcoded strings - all text configurable via props
 * - Consistent typography from EnterpriseOverlays
 * - Brand colors from COLORS constant
 */

import { memo } from 'react'
import {
  OverlayContainer,
  EnterpriseCard,
  EnterpriseTitle,
  EnterpriseButton,
  EnterpriseDivider,
  StatBox,
  StatRow,
  HighlightBox,
  RankDisplay,
  XPDisplay,
} from '../EnterpriseOverlays'
import type { TriviaStats } from '@/survival/hooks/useSurvivalTrivia'

// ============================================
// Types
// ============================================

// Base stats shared between guest and auth modes
export interface BaseRunStats {
  distance: number
  score: number
  maxCombo: number
  isNewPB: boolean
  triviaStats: TriviaStats
}

// Guest-specific stats
export interface GuestRunStats extends BaseRunStats {
  previewXp: number
  estimatedRank: number | null
  totalPlayers: number
}

// Auth-specific stats
export interface AuthRunStats extends BaseRunStats {
  newRank?: number
  xpAwarded?: number
}

interface GameOverOverlayBaseProps {
  stats: BaseRunStats
  onPlayAgain: () => void
  onViewLeaderboard: () => void
  onBack: () => void
  backLabel?: string
  /** Custom title for new PB - defaults to "New Personal Best!" */
  newPBTitle?: string
  /** Custom title for game over - defaults to "Game Over" */
  gameOverTitle?: string
  /** Play again button label */
  playAgainLabel?: string
  /** View leaderboard button label */
  leaderboardLabel?: string
}

interface GuestGameOverOverlayProps extends GameOverOverlayBaseProps {
  mode: 'guest'
  stats: GuestRunStats
  sessionStats: { bestDistance: number; totalRuns: number; previewXpEarned: number }
  showSavePrompt: boolean
  onCreateAccount: () => void
}

interface AuthGameOverOverlayProps extends GameOverOverlayBaseProps {
  mode: 'auth'
  stats: AuthRunStats
  playerRank?: { rank: number; bestDistance: number }
}

type GameOverOverlayProps = GuestGameOverOverlayProps | AuthGameOverOverlayProps

// ============================================
// Component
// ============================================

export const GameOverOverlay = memo((props: GameOverOverlayProps) => {
  const { 
    stats, 
    onPlayAgain, 
    onViewLeaderboard, 
    onBack, 
    backLabel = 'Back',
    newPBTitle = 'New Personal Best!',
    gameOverTitle = 'Game Over',
    playAgainLabel = 'Play Again',
    leaderboardLabel = 'View Leaderboard',
  } = props
  
  const triviaAccuracy = stats.triviaStats.questionsAnswered > 0 
    ? Math.round((stats.triviaStats.questionsCorrect / stats.triviaStats.questionsAnswered) * 100) 
    : 0

  // Determine title based on PB status
  const title = stats.isNewPB ? `🎉 ${newPBTitle.toUpperCase()}` : gameOverTitle.toUpperCase()

  return (
    <OverlayContainer blur="md" darkness={70}>
      <EnterpriseCard 
        maxWidth="md" 
        glow={stats.isNewPB ? 'strong' : 'subtle'} 
        glowColor={stats.isNewPB ? '#fbbf24' : '#f97316'}
      >
        <EnterpriseTitle 
          variant={stats.isNewPB ? 'success' : 'default'} 
          size="lg"
          glow={stats.isNewPB}
        >
          {title}
        </EnterpriseTitle>

        {/* Run Stats - Distance & Score */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <StatBox 
            value={`${Math.floor(stats.distance).toLocaleString()}m`}
            label="Distance"
            color="#ffffff"
            size="md"
            delay={100}
          />
          <StatBox 
            value={stats.score.toLocaleString()}
            label="Score"
            color="#fbbf24"
            size="md"
            delay={150}
          />
        </div>

        {/* Combo & Trivia Stats */}
        <StatRow 
          items={[
            { value: `${stats.maxCombo}x`, label: 'Max Combo', color: '#f97316' },
            { value: `${stats.triviaStats.questionsCorrect}/${stats.triviaStats.questionsAnswered}`, label: 'Trivia', color: '#22c55e' },
            { value: `${triviaAccuracy}%`, label: 'Accuracy', color: '#22d3ee' },
          ]}
          size="sm"
        />

        {/* Trivia Streak & Score */}
        {stats.triviaStats.questionsAnswered > 0 && (
          <div className="flex gap-2 mt-3">
            <HighlightBox gradient="purple">
              <div className="text-sm font-bold text-purple-400 text-center">
                🔥 {stats.triviaStats.maxStreak} streak
              </div>
            </HighlightBox>
            <HighlightBox gradient="cyan">
              <div className="text-sm font-bold text-cyan-400 text-center">
                +{stats.triviaStats.triviaScore} trivia pts
              </div>
            </HighlightBox>
          </div>
        )}

        {/* Mode-specific content */}
        {props.mode === 'guest' && (
          <GuestContent 
            stats={props.stats}
            sessionStats={props.sessionStats}
            showSavePrompt={props.showSavePrompt}
            onCreateAccount={props.onCreateAccount}
          />
        )}
        
        {props.mode === 'auth' && (
          <AuthContent 
            stats={props.stats}
            playerRank={props.playerRank}
          />
        )}

        <EnterpriseDivider />

        {/* Actions */}
        <div className="space-y-3">
          <EnterpriseButton onClick={onPlayAgain} variant="primary" fullWidth shortcut="R">
            {playAgainLabel}
          </EnterpriseButton>
          <EnterpriseButton onClick={onViewLeaderboard} variant="secondary" fullWidth>
            {leaderboardLabel}
          </EnterpriseButton>
          <EnterpriseButton onClick={onBack} variant="ghost" fullWidth>
            {backLabel}
          </EnterpriseButton>
        </div>
      </EnterpriseCard>
    </OverlayContainer>
  )
})
GameOverOverlay.displayName = 'GameOverOverlay'

// Guest-specific content
const GuestContent = memo(({ 
  stats, 
  sessionStats, 
  showSavePrompt, 
  onCreateAccount 
}: {
  stats: GuestRunStats
  sessionStats: { bestDistance: number; totalRuns: number; previewXpEarned: number }
  showSavePrompt: boolean
  onCreateAccount: () => void
}) => (
  <>
    {/* Leaderboard Rank Preview */}
    {stats.estimatedRank !== null && (
      <div className="mt-3">
        <RankDisplay 
          rank={stats.estimatedRank}
          totalPlayers={stats.totalPlayers}
          label="Your Rank"
          size="md"
        />
      </div>
    )}

    {/* Preview XP Earned */}
    <div className="mt-3">
      <XPDisplay 
        xp={stats.previewXp}
        label="Preview XP Earned"
        totalXp={sessionStats.previewXpEarned}
      />
    </div>

    {/* Save Prompt */}
    {showSavePrompt && (
      <>
        <EnterpriseDivider />
        <HighlightBox gradient="orange" animate>
          <p className="text-white font-semibold text-center mb-2">
            Want to save this run?
          </p>
          <p className="text-neutral-400 text-sm text-center mb-3 font-medium">
            Create an account to save your progress, compete on leaderboards, and unlock rewards!
          </p>
          <EnterpriseButton onClick={onCreateAccount} variant="primary" fullWidth size="sm">
            Create Account & Save Run
          </EnterpriseButton>
        </HighlightBox>
      </>
    )}
  </>
))
GuestContent.displayName = 'GuestContent'

// Auth-specific content
const AuthContent = memo(({ 
  stats, 
  playerRank 
}: {
  stats: AuthRunStats
  playerRank?: { rank: number; bestDistance: number }
}) => (
  <>
    {/* Current Rank */}
    {playerRank && (
      <div className="mt-3">
        <RankDisplay 
          rank={playerRank.rank}
          label="Your Rank"
          size="md"
        />
      </div>
    )}

    {/* XP Awarded */}
    {stats.xpAwarded && (
      <div className="mt-3">
        <XPDisplay 
          xp={stats.xpAwarded}
          label="XP Earned"
        />
      </div>
    )}
  </>
))
AuthContent.displayName = 'AuthContent'
