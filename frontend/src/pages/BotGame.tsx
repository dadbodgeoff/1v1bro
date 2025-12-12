/**
 * BotGame - Practice mode against a bot opponent
 * Thin UI wrapper that delegates to useBotGame hook
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameArena } from '@/components/game/GameArena'
import { ArenaScoreboard } from '@/components/game/ArenaScoreboard'
import { ArenaQuizPanel } from '@/components/game/ArenaQuizPanel'
import { RoundResultOverlay } from '@/components/game/RoundResultOverlay'
import { useBotGame } from '@/hooks/useBotGame'
import { SIMPLE_ARENA, type MapConfig } from '@/game/config/maps'
import { AVAILABLE_MAPS as MAP_INFO } from '@/game/config/maps/map-loader'
import { getMapConfig } from '@/game/config/maps/map-loader'
import { BREAKPOINTS } from '@/utils/breakpoints'
import type { FireEvent, HitEvent, DeathEvent } from '@/game'

// Use the centralized AVAILABLE_MAPS from map-loader (respects feature flags)
const AVAILABLE_MAPS = MAP_INFO.map(info => ({
  id: info.slug,
  name: info.name,
  description: info.description,
  config: getMapConfig(info.slug),
}))

export function BotGame() {
  const navigate = useNavigate()
  const [isMobileLandscape, setIsMobileLandscape] = useState(false)
  const [mapConfig, setMapConfig] = useState<MapConfig>(SIMPLE_ARENA)

  const {
    userId, isGuest, status, localScore, opponentScore, gameStarted, waitingForBot,
    questionsLoading, questionsError, selectedCategory, setSelectedCategory,
    categories, categoriesLoading, botPosition, playerKills, botKills,
    localHealth, opponentHealth, startGame, handleAnswer, handlePositionUpdate,
    handleCombatHit, handleLeave, handlePlayAgain,
    setServerProjectilesCallback,
    setServerHealthCallback,
    handleLocalHazardDamage,
    handleLocalTrapTriggered,
    inventoryEmotes, equippedEmoteId,
    powerUps, handlePowerUpCollect,
  } = useBotGame()

  useEffect(() => {
    const check = () => {
      const isMobile = window.innerWidth < BREAKPOINTS.tablet
      const isLandscape = window.innerWidth > window.innerHeight
      setIsMobileLandscape(isMobile && isLandscape)
    }
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  const onCombatHit = (e: HitEvent) => handleCombatHit(e.targetId, e.damage)
  const onCombatFire = (_: FireEvent) => {}
  const onCombatDeath = (_: DeathEvent) => {}

  if (!gameStarted) {
    return (
      <SetupScreen categories={categories} categoriesLoading={categoriesLoading}
        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
        selectedMap={mapConfig} setSelectedMap={setMapConfig}
        questionsLoading={questionsLoading} questionsError={questionsError}
        onStart={startGame} onBack={() => navigate(isGuest ? '/' : '/dashboard')} isGuest={isGuest} />
    )
  }

  if (status === 'finished') {
    return (
      <ResultsScreen localScore={localScore} opponentScore={opponentScore}
        playerKills={playerKills} botKills={botKills} isGuest={isGuest}
        onPlayAgain={handlePlayAgain} onBack={() => navigate(isGuest ? '/' : '/dashboard')} />
    )
  }

  const showQuestion = status === 'playing' && !waitingForBot
  const showRoundResult = status === 'round_result'

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      <ArenaScoreboard localHealth={localHealth} opponentHealth={opponentHealth} showHealth showQuestion={false} onAnswer={handleAnswer} />
      <div className="flex-1 relative min-h-0">
        <div className="h-full relative">
          <GameArena playerId={userId} isPlayer1 opponentId="bot" opponentPosition={botPosition}
            powerUps={powerUps} onPositionUpdate={handlePositionUpdate} onPowerUpCollect={handlePowerUpCollect}
            mapConfig={mapConfig} combatEnabled onCombatFire={onCombatFire} onCombatHit={onCombatHit}
            onCombatDeath={onCombatDeath}
            setServerProjectilesCallback={setServerProjectilesCallback}
            setServerHealthCallback={setServerHealthCallback}
            onLocalHazardDamage={handleLocalHazardDamage}
            onLocalTrapTriggered={handleLocalTrapTriggered}
            inventoryEmotes={inventoryEmotes}
            equippedEmoteId={equippedEmoteId} />
          {waitingForBot && <BotThinkingIndicator />}
          <RoundResultOverlay visible={showRoundResult} />
          <ControlsHint />
          <LeaveButton onClick={handleLeave} isMobileLandscape={isMobileLandscape} />
        </div>
      </div>
      {isMobileLandscape ? <ArenaQuizPanel onAnswer={handleAnswer} visible={showQuestion} overlayMode />
        : <ArenaQuizPanel onAnswer={handleAnswer} visible={showQuestion} />}
    </div>
  )
}

interface SetupProps {
  categories: { slug: string; name: string; question_count: number }[]
  categoriesLoading: boolean
  selectedCategory: string
  setSelectedCategory: (c: string) => void
  selectedMap: MapConfig
  setSelectedMap: (m: MapConfig) => void
  questionsLoading: boolean
  questionsError: string | null
  onStart: () => void
  onBack: () => void
  isGuest: boolean
}

function SetupScreen({ categories, categoriesLoading, selectedCategory, setSelectedCategory,
  selectedMap, setSelectedMap, questionsLoading, questionsError, onStart, onBack, isGuest }: SetupProps) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">Practice Mode</h1>
      <p className="text-neutral-500 mb-6 text-center max-w-md text-sm">Practice against an AI opponent.</p>
      <div className="w-full max-w-md mb-6">
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3 text-center">Select Category</p>
        <div className="grid grid-cols-2 gap-3">
          {categoriesLoading ? <div className="col-span-2 text-center py-4 text-neutral-500 text-sm">Loading...</div>
            : categories.map((cat) => {
              const has = cat.question_count > 0
              return (
                <button key={cat.slug} onClick={() => has && setSelectedCategory(cat.slug)} disabled={!has}
                  className={`p-4 min-h-[44px] rounded-xl border transition-all text-left ${!has ? 'opacity-50 cursor-not-allowed' : selectedCategory === cat.slug ? 'bg-indigo-500/20 border-indigo-500/40' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${selectedCategory === cat.slug ? 'bg-indigo-400' : 'bg-neutral-600'}`} />
                    <span className="text-sm font-medium text-white">{cat.name}</span>
                  </div>
                  <p className="text-xs text-neutral-500">{has ? `${cat.question_count} questions` : 'No questions'}</p>
                </button>
              )
            })}
        </div>
      </div>
      <div className="w-full max-w-md mb-8">
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3 text-center">Select Map</p>
        <div className="grid grid-cols-2 gap-3">
          {AVAILABLE_MAPS.map((m) => (
            <button key={m.id} onClick={() => setSelectedMap(m.config)}
              className={`p-4 min-h-[44px] rounded-xl border transition-all text-left ${selectedMap === m.config ? 'bg-white/[0.08] border-white/20' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${selectedMap === m.config ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                <span className="text-sm font-medium text-white">{m.name}</span>
              </div>
              <p className="text-xs text-neutral-500">{m.description}</p>
            </button>
          ))}
        </div>
      </div>
      {questionsError && (
        <div className="w-full max-w-md mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm text-center mb-3">{questionsError}</p>
          <button onClick={onStart} className="w-full px-4 py-2 bg-red-500/20 text-red-300 text-sm rounded-lg">Try Again</button>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={onStart} disabled={questionsLoading || !!questionsError} className="px-6 py-2.5 min-h-[44px] bg-white text-black text-sm font-medium rounded-lg disabled:opacity-50">
          {questionsLoading ? 'Loading...' : 'Start Game'}
        </button>
        <button onClick={onBack} className="px-6 py-2.5 min-h-[44px] bg-white/[0.06] text-neutral-300 text-sm rounded-lg border border-white/[0.1]">Back</button>
      </div>
      {isGuest && <p className="text-xs text-neutral-500 mt-4">Playing as guest · <button onClick={() => navigate('/register')} className="text-blue-500 hover:text-blue-400">Sign up</button></p>}
    </div>
  )
}

interface ResultsProps {
  localScore: number; opponentScore: number; playerKills: number; botKills: number
  isGuest: boolean; onPlayAgain: () => void; onBack: () => void
}

function ResultsScreen({ localScore, opponentScore, playerKills, botKills, isGuest, onPlayAgain, onBack }: ResultsProps) {
  const navigate = useNavigate()
  const won = localScore > opponentScore, tied = localScore === opponentScore
  const kd = botKills > 0 ? (playerKills / botKills).toFixed(1) : playerKills.toFixed(1)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className={`w-3 h-3 rounded-full mb-4 ${won ? 'bg-emerald-400' : tied ? 'bg-amber-400' : 'bg-red-400'}`} />
      <h1 className="text-2xl font-semibold text-white mb-1">{won ? 'Victory' : tied ? 'Draw' : 'Defeat'}</h1>
      <div className="text-4xl font-semibold text-white tabular-nums mb-4">{localScore} <span className="text-neutral-600">-</span> {opponentScore}</div>
      <div className="flex gap-6 mb-6 text-sm">
        <div className="text-center"><div className="text-2xl font-bold text-emerald-400">{playerKills}</div><div className="text-neutral-500">Kills</div></div>
        <div className="text-center"><div className="text-2xl font-bold text-red-400">{botKills}</div><div className="text-neutral-500">Deaths</div></div>
        <div className="text-center"><div className="text-2xl font-bold text-amber-400">{kd}</div><div className="text-neutral-500">K/D</div></div>
      </div>
      {isGuest && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mb-6 max-w-sm text-center">
          <p className="text-white font-medium mb-1">Ready to compete?</p>
          <p className="text-neutral-400 text-sm mb-3">Sign up to play real players.</p>
          <button onClick={() => navigate('/register')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg w-full transition-colors">Create Account</button>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={onPlayAgain} className="px-6 py-2.5 min-h-[44px] bg-white text-black text-sm rounded-lg">Play Again</button>
        <button onClick={onBack} className="px-6 py-2.5 min-h-[44px] bg-white/[0.06] text-neutral-300 text-sm rounded-lg border border-white/[0.1]">{isGuest ? 'Home' : 'Menu'}</button>
      </div>
    </div>
  )
}

function BotThinkingIndicator() {
  return (
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
  )
}

function ControlsHint() {
  return (
    <div className="absolute bottom-2 lg:bottom-3 left-2 lg:left-3 hidden lg:block z-10">
      <div className="px-2 py-1.5 bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded">
        <p className="text-[9px] text-neutral-500 font-mono">WASD move · Click shoot · E emote · 1-4 answer</p>
      </div>
    </div>
  )
}

function LeaveButton({ onClick, isMobileLandscape }: { onClick: () => void; isMobileLandscape: boolean }) {
  // In mobile landscape, position at top-right to avoid Fire button overlap
  const positionStyle = isMobileLandscape
    ? {
        top: 'max(8px, env(safe-area-inset-top, 8px))',
        right: 'max(8px, env(safe-area-inset-right, 8px))',
        bottom: 'auto',
      }
    : { bottom: '12px', right: '12px' }

  return (
    <div className={`absolute z-10 ${isMobileLandscape ? '' : 'safe-area-bottom'}`} style={positionStyle}>
      <button
        onClick={onClick}
        className="px-2 py-1.5 text-[10px] text-neutral-600 hover:text-red-400 bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded min-h-[44px] min-w-[44px] touch-manipulation"
      >
        Leave
      </button>
    </div>
  )
}
