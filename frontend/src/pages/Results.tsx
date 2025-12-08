import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { useLobbyStore } from '@/stores/lobbyStore'
import { Button } from '@/components/ui'

export function Results() {
  useParams<{ code: string }>()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)
  const { finalResult, localPlayerName, opponentName, reset: resetGame } = useGameStore()
  const { reset: resetLobby } = useLobbyStore()

  if (!finalResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  const isWinner = finalResult.winnerId === userId
  const isTie = finalResult.isTie

  const handlePlayAgain = () => {
    resetGame()
    navigate('/dashboard')
  }

  const handleReturnHome = () => {
    resetGame()
    resetLobby()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Result announcement */}
      <div className="text-center mb-8">
        {isTie ? (
          <>
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">It's a Tie!</h1>
            <p className="text-slate-400">Great minds think alike</p>
          </>
        ) : isWinner ? (
          <>
            <h1 className="text-4xl font-bold text-green-400 mb-2">You Won! 🎉</h1>
            <p className="text-slate-400">Congratulations!</p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold text-red-400 mb-2">You Lost</h1>
            <p className="text-slate-400">Better luck next time!</p>
          </>
        )}
      </div>

      {/* Score card */}
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mb-8">
        <h2 className="text-slate-400 text-center mb-6">Final Scores</h2>

        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold mx-auto mb-2">
              {(localPlayerName || 'Y')[0].toUpperCase()}
            </div>
            <p className="text-white font-medium mb-1">
              {localPlayerName || 'You'}
            </p>
            <p className="text-3xl font-bold text-indigo-400">
              {finalResult.localScore}
            </p>
          </div>

          <div className="text-4xl text-slate-600">vs</div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-2xl font-bold mx-auto mb-2">
              {(opponentName || 'O')[0].toUpperCase()}
            </div>
            <p className="text-white font-medium mb-1">
              {opponentName || 'Opponent'}
            </p>
            <p className="text-3xl font-bold text-red-400">
              {finalResult.opponentScore}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button size="lg" onClick={handlePlayAgain}>
          Play Again
        </Button>
        <Button size="lg" variant="secondary" onClick={handleReturnHome}>
          Return to Menu
        </Button>
      </div>
    </div>
  )
}
