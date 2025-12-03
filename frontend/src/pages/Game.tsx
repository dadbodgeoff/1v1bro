import { useParams } from 'react-router-dom'
import { useGame } from '@/hooks/useGame'
import { QuestionCard, Scoreboard } from '@/components/game'
import { Button } from '@/components/ui'

export function Game() {
  const { code } = useParams<{ code: string }>()
  const { status, currentQuestion, roundResult, sendAnswer, leaveGame } = useGame(code)

  // Loading state
  if (status === 'idle' || status === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-4" />
        <p className="text-slate-400">Waiting for game to start...</p>
      </div>
    )
  }

  // Countdown state
  if (status === 'countdown') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-6xl font-bold text-indigo-500 animate-pulse">
          Get Ready!
        </div>
      </div>
    )
  }

  // Round result state
  if (status === 'round_result' && roundResult) {
    return (
      <div className="min-h-screen flex flex-col">
        <Scoreboard />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
            <p className="text-slate-400 mb-2">Correct Answer</p>
            <p className="text-3xl font-bold text-green-400 mb-6">
              {roundResult.correctAnswer}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-slate-400 text-sm">You</p>
                <p className="text-2xl font-bold text-indigo-400">
                  +{roundResult.localScore}
                </p>
                <p className="text-slate-500 text-sm">
                  {roundResult.localAnswer || 'No answer'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Opponent</p>
                <p className="text-2xl font-bold text-red-400">
                  +{roundResult.opponentScore}
                </p>
                <p className="text-slate-500 text-sm">
                  {roundResult.opponentAnswer || 'No answer'}
                </p>
              </div>
            </div>

            <p className="text-slate-500 text-sm">Next question coming up...</p>
          </div>
        </div>
      </div>
    )
  }

  // Playing state
  if (status === 'playing' && currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col">
        <Scoreboard />
        <div className="flex-1 flex items-center justify-center p-4">
          <QuestionCard onAnswer={sendAnswer} />
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <p className="text-slate-400 mb-4">Something went wrong</p>
      <Button onClick={leaveGame}>Return to Home</Button>
    </div>
  )
}
