import { useState, type FormEvent } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Button, Input } from '@/components/ui'
import { useLobby } from '@/hooks/useLobby'

export function Home() {
  const { user, logout } = useAuthStore()
  const { createLobby, joinLobby } = useLobby()

  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  const handleCreate = async () => {
    setError('')
    setIsCreating(true)
    try {
      await createLobby()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lobby')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    setError('')
    setIsJoining(true)
    try {
      await joinLobby(joinCode.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join lobby')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold text-indigo-500 mb-2">1v1 Bro</h1>
      <p className="text-slate-400 mb-8">
        Welcome, {user?.display_name || user?.email || 'Player'}!
      </p>

      {error && (
        <div className="w-full max-w-xs mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button
          size="lg"
          className="w-full"
          onClick={handleCreate}
          isLoading={isCreating}
        >
          Create Lobby
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 text-slate-500">or</span>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-3">
          <Input
            placeholder="Enter lobby code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="text-center text-lg tracking-widest uppercase"
          />
          <Button
            type="submit"
            size="lg"
            variant="secondary"
            className="w-full"
            isLoading={isJoining}
            disabled={!joinCode.trim()}
          >
            Join Lobby
          </Button>
        </form>
      </div>

      <div className="mt-8 text-slate-500 text-sm text-center">
        <p>Games Played: {user?.games_played || 0}</p>
        <p>Games Won: {user?.games_won || 0}</p>
      </div>

      <Button variant="ghost" className="mt-8" onClick={logout}>
        Sign Out
      </Button>
    </div>
  )
}
