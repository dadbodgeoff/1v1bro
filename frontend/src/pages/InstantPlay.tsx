/**
 * InstantPlay - Zero-friction guest play page
 * 
 * Integrates all guest systems for a seamless play experience:
 * - QuickCategoryPicker for category selection
 * - InstantPlayTutorial for controls overlay
 * - GuestSessionManager for progress tracking
 * - EngagementFeedbackSystem for XP popups
 * - SoftConversionPrompts for signup nudges
 * 
 * @module pages/InstantPlay
 */

import { GameArena } from '@/components/game/GameArena'
import { ArenaScoreboard } from '@/components/game/ArenaScoreboard'
import { ArenaQuizPanel } from '@/components/game/ArenaQuizPanel'
import { RoundResultOverlay } from '@/components/game/RoundResultOverlay'
import { QuickCategoryPicker } from '@/components/game/QuickCategoryPicker'
import { InstantPlayTutorial } from '@/components/game/InstantPlayTutorial'
import { GuestMatchSummary } from '@/components/game/GuestMatchSummary'
import { ConversionPromptModal } from '@/components/game/ConversionPromptModal'
import { VORTEX_ARENA } from '@/game/config/maps'
import { useInstantPlay } from '@/hooks/useInstantPlay'
import type { PowerUpState } from '@/game'

export function InstantPlay() {
  const {
    phase,
    questionsLoading,
    status,
    currentQuestion,
    waitingForBot,
    botPosition,
    localHealth,
    opponentHealth,
    equippedSkin,
    opponentSkin,
    matchResult,
    newMilestones,
    sessionManager,
    showConversionPrompt,
    currentPrompt,
    isMobileLandscape,
    handleCategorySelect,
    handleTutorialDismiss,
    handleAnswer,
    handlePositionUpdate,
    handleCombatFire,
    handleCombatHit,
    handleCombatDeath,
    setServerProjectilesCallback,
    setServerHealthCallback,
    handlePlayAgain,
    handleLeave,
    handlePromptDismiss,
    handlePromptCta,
  } = useInstantPlay()

  const powerUps: PowerUpState[] = []


  // Category picker phase
  if (phase === 'category') {
    return (
      <QuickCategoryPicker
        visible={true}
        onSelect={handleCategorySelect}
      />
    )
  }

  // Tutorial phase
  if (phase === 'tutorial') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <InstantPlayTutorial
          visible={true}
          onDismiss={handleTutorialDismiss}
          autoDismissMs={5000}
        />
        {questionsLoading && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 text-neutral-500 text-sm">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Loading questions...
            </div>
          </div>
        )}
      </div>
    )
  }

  // Summary phase
  if (phase === 'summary' && matchResult) {
    return (
      <>
        <GuestMatchSummary
          visible={true}
          result={matchResult}
          previewXp={sessionManager.getSession().previewXpEarned}
          totalSessionXp={sessionManager.getSession().previewXpEarned}
          newMilestones={newMilestones}
          onPlayAgain={handlePlayAgain}
          onDismiss={handleLeave}
        />
        <ConversionPromptModal
          visible={showConversionPrompt}
          prompt={currentPrompt}
          onPrimaryCta={handlePromptCta}
          onSecondaryCta={handlePromptDismiss}
        />
      </>
    )
  }

  // Playing phase
  const showQuestion = status === 'playing' && !!currentQuestion && !waitingForBot
  const showRoundResult = status === 'round_result'

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      <ArenaScoreboard
        localHealth={localHealth}
        opponentHealth={opponentHealth}
        showHealth={true}
        showQuestion={false}
        onAnswer={handleAnswer}
      />

      <div className="flex-1 relative min-h-0">
        <div className="h-full relative">
          <GameArena
            playerId="guest"
            isPlayer1={true}
            opponentId="bot"
            opponentPosition={botPosition}
            powerUps={powerUps}
            onPositionUpdate={handlePositionUpdate}
            onPowerUpCollect={() => {}}
            mapConfig={VORTEX_ARENA}
            combatEnabled={true}
            onCombatFire={handleCombatFire}
            onCombatHit={handleCombatHit}
            onCombatDeath={handleCombatDeath}
            setServerProjectilesCallback={setServerProjectilesCallback}
            setServerHealthCallback={setServerHealthCallback}
            equippedSkin={equippedSkin}
            opponentSkin={opponentSkin}
          />

          {waitingForBot && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-black/70 backdrop-blur-sm border border-white/[0.08] rounded-lg px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" />
                    <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] text-white/40">bot thinking</span>
                </div>
              </div>
            </div>
          )}

          <RoundResultOverlay visible={showRoundResult} />

          <div className="absolute bottom-2 lg:bottom-3 left-2 lg:left-3 hidden lg:block z-10">
            <div className="px-2 py-1.5 bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded">
              <p className="text-[9px] text-neutral-500 font-mono">WASD move · Click shoot · 1-4 answer</p>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 z-10" style={{ bottom: isMobileLandscape ? '140px' : '12px' }}>
            <button
              onClick={handleLeave}
              className="px-2 py-1.5 text-[10px] text-neutral-600 hover:text-red-400 bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded transition-colors min-h-[44px] min-w-[44px]"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {isMobileLandscape ? (
        <ArenaQuizPanel onAnswer={handleAnswer} visible={showQuestion} overlayMode={true} />
      ) : (
        <ArenaQuizPanel onAnswer={handleAnswer} visible={showQuestion} />
      )}
    </div>
  )
}
