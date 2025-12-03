import { useGameStore } from '@/stores/gameStore'

export function Scoreboard() {
  const {
    localPlayerName,
    localScore,
    opponentName,
    opponentScore,
    questionNumber,
    totalQuestions,
  } = useGameStore()

  return (
    <div className="flex items-center justify-center gap-4 p-4">
      <div className="flex items-center gap-4 bg-slate-800/80 backdrop-blur-sm rounded-xl px-6 py-3 border border-slate-700">
        {/* Local player */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-white font-medium">
            {localPlayerName || 'You'}
          </span>
          <span className="text-2xl font-bold text-indigo-400 tabular-nums">
            {localScore}
          </span>
        </div>

        {/* Divider with question count */}
        <div className="flex flex-col items-center px-4 border-x border-slate-700">
          <span className="text-slate-500 text-xs">Round</span>
          <span className="text-white font-bold">
            {questionNumber}/{totalQuestions}
          </span>
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-red-400 tabular-nums">
            {opponentScore}
          </span>
          <span className="text-white font-medium">
            {opponentName || 'Opponent'}
          </span>
          <div className="w-3 h-3 rounded-full bg-red-500" />
        </div>
      </div>
    </div>
  )
}
