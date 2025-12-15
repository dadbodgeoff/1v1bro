/**
 * SurvivalLeaderboard - Public leaderboard page for survival mode
 */

import { useState, useMemo, useEffect, useRef, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useLeaderboard } from '@/survival/hooks/useLeaderboard'
import { useLeaderboardAnalytics } from '@/hooks/useLeaderboardAnalytics'
import type { LeaderboardEntry, ConnectionState } from '@/survival/services/LeaderboardService'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
const ANIMATION_STAGGER_MS = 40
const SEARCH_DEBOUNCE_MS = 300

function ConnectionIndicator({ state, lastUpdated }: { state: ConnectionState; lastUpdated?: number }) {
  const config = {
    connected: { color: 'bg-emerald-500', ring: 'ring-emerald-500/30', label: 'Live' },
    connecting: { color: 'bg-amber-500', ring: 'ring-amber-500/30', label: 'Syncing' },
    disconnected: { color: 'bg-neutral-500', ring: 'ring-neutral-500/30', label: 'Offline' },
    error: { color: 'bg-red-500', ring: 'ring-red-500/30', label: 'Error' },
  }[state]

  const timeAgo = useMemo(() => {
    if (!lastUpdated) return null
    const seconds = Math.floor((Date.now() - lastUpdated) / 1000)
    if (seconds < 5) return 'now'
    if (seconds < 60) return `${seconds}s`
    return `${Math.floor(seconds / 60)}m`
  }, [lastUpdated])

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-2.5 h-2.5">
        <div className={`absolute inset-0 rounded-full ${config.color} ${state === 'connected' ? 'animate-ping opacity-75' : ''}`} />
        <div className={`relative w-2 h-2 rounded-full ${config.color} ring-2 ${config.ring}`} />
      </div>
      <span className="text-xs font-medium text-neutral-400">
        {config.label}
        {timeAgo && state === 'connected' && <span className="text-neutral-500 ml-1">· {timeAgo}</span>}
      </span>
    </div>
  )
}

function StatsCard({ label, value, suffix = '', icon }: { label: string; value: number | string; suffix?: string; icon?: string }) {
  return (
    <div className="group relative bg-white/[0.03] hover:bg-white/[0.06] rounded-xl p-4 border border-white/[0.06] hover:border-orange-500/20 transition-all duration-300">
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          {icon && <span className="text-orange-400">{icon}</span>}
          <span className="text-2xl md:text-3xl font-bold text-white tabular-nums tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-lg text-neutral-400 ml-0.5">{suffix}</span>}
          </span>
        </div>
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  )
}


function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/40"><span className="text-lg">👑</span></div>
  if (rank === 2) return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-500 flex items-center justify-center shadow-lg"><span className="text-sm font-bold text-neutral-700">2</span></div>
  if (rank === 3) return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-800 flex items-center justify-center shadow-lg"><span className="text-sm font-bold text-white">3</span></div>
  return <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center"><span className="text-sm font-semibold text-neutral-400 tabular-nums">{rank}</span></div>
}

function Avatar({ url, name }: { url?: string; name: string }) {
  if (url) return <img src={url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white/10" loading="lazy" />
  return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm">{name.charAt(0).toUpperCase()}</div>
}

const LeaderboardRow = memo(function LeaderboardRow({ entry, isCurrentUser, isHighlighted, animationDelay = 0 }: { entry: LeaderboardEntry; isCurrentUser: boolean; isHighlighted: boolean; animationDelay?: number }) {
  return (
    <div 
      className={`group flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl transition-all duration-300
        ${isCurrentUser ? 'bg-orange-500/10 border border-orange-500/30 shadow-lg shadow-orange-500/10' : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]'}
        ${isHighlighted ? 'ring-2 ring-cyan-500/50 ring-offset-2 ring-offset-[#09090b]' : ''}`}
      style={{ animation: `slideInUp 0.4s ease-out ${animationDelay}ms both` }}
    >
      <RankBadge rank={entry.rank} />
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar url={entry.avatarUrl} name={entry.displayName} />
        <div className="min-w-0 flex-1">
          <div className={`font-semibold truncate ${isCurrentUser ? 'text-orange-400' : 'text-white'}`}>
            {entry.displayName}
            {isCurrentUser && <span className="ml-2 text-[10px] font-medium text-orange-400/60 uppercase tracking-wider">(You)</span>}
          </div>
          {entry.totalRuns !== undefined && <div className="text-[11px] text-neutral-500 tabular-nums">{entry.totalRuns} runs</div>}
        </div>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <div className="text-right min-w-[80px]">
          <div className="text-lg font-bold text-white tabular-nums">{Math.floor(entry.bestDistance).toLocaleString()}m</div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Distance</div>
        </div>
        <div className="text-right min-w-[80px]">
          <div className="text-lg font-bold text-amber-400 tabular-nums">{entry.bestScore.toLocaleString()}</div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Score</div>
        </div>
        <div className="text-right min-w-[60px]">
          <div className="text-lg font-bold text-purple-400 tabular-nums">{entry.bestCombo}x</div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Combo</div>
        </div>
      </div>
      <div className="md:hidden text-right">
        <div className="text-base font-bold text-white tabular-nums">{Math.floor(entry.bestDistance).toLocaleString()}m</div>
        <div className="text-[10px] text-neutral-500">{entry.bestScore.toLocaleString()} pts</div>
      </div>
    </div>
  )
})

function PlayerRankCard({ entry, totalPlayers }: { entry: LeaderboardEntry; totalPlayers: number }) {
  const percentile = Math.max(1, Math.round((1 - entry.rank / totalPlayers) * 100))
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-orange-500/20">
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Your Ranking</h3>
          <div className="px-3 py-1 bg-orange-500/20 rounded-full"><span className="text-xs font-bold text-orange-400">Top {percentile}%</span></div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black text-orange-400 tabular-nums">#</span>
            <span className="text-5xl font-black text-white tabular-nums">{entry.rank}</span>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-white tabular-nums">{Math.floor(entry.bestDistance).toLocaleString()}m</div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider mt-1">Distance</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-400 tabular-nums">{entry.bestScore.toLocaleString()}</div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider mt-1">Score</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400 tabular-nums">{entry.bestCombo}x</div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider mt-1">Combo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


function LoadingSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl animate-pulse">
          <div className="w-10 h-10 rounded-full bg-white/[0.06]" />
          <div className="w-10 h-10 rounded-full bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-white/[0.06] rounded" />
            <div className="h-3 w-20 bg-white/[0.04] rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Pagination({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange, totalItems }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void; pageSize: number; onPageSizeChange: (size: number) => void; totalItems: number }) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
      <div className="flex items-center gap-3 text-sm text-neutral-500">
        <span>Show</span>
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className="px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-orange-500/50">
          {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size}</option>)}
        </select>
        <span>entries</span>
      </div>
      <div className="text-sm text-neutral-500">
        Showing <span className="text-white font-medium tabular-nums">{startItem}</span> to <span className="text-white font-medium tabular-nums">{endItem}</span> of <span className="text-white font-medium tabular-nums">{totalItems.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-2 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors">⟪</button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm transition-colors">Previous</button>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm transition-colors">Next</button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="p-2 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors">⟫</button>
      </div>
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>
      <input ref={inputRef} type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all" />
      {value && (
        <button onClick={() => { onChange(''); inputRef.current?.focus() }} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  )
}


export function SurvivalLeaderboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { leaderboard, stats, isLoading, connectionState, refresh } = useLeaderboard({ autoStart: true, pollInterval: 10000 })
  const lbAnalytics = useLeaderboardAnalytics()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<'distance' | 'score' | 'combo'>('distance')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [updateKey, setUpdateKey] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchQuery); setCurrentPage(1) }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => { setCurrentPage(1) }, [sortBy, pageSize])
  useEffect(() => { if (leaderboard?.lastUpdated) setUpdateKey(prev => prev + 1) }, [leaderboard?.lastUpdated])
  
  const { filteredEntries, totalFiltered } = useMemo(() => {
    if (!leaderboard?.entries) return { filteredEntries: [], totalFiltered: 0 }
    let entries = [...leaderboard.entries]
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      entries = entries.filter(e => e.displayName.toLowerCase().includes(query))
    }
    entries.sort((a, b) => {
      switch (sortBy) {
        case 'score': return b.bestScore - a.bestScore
        case 'combo': return b.bestCombo - a.bestCombo
        default: return b.bestDistance - a.bestDistance
      }
    })
    const reranked = entries.map((e, i) => ({ ...e, rank: sortBy === 'distance' ? e.rank : i + 1 }))
    return { filteredEntries: reranked, totalFiltered: reranked.length }
  }, [leaderboard?.entries, debouncedSearch, sortBy])

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, currentPage, pageSize])

  const totalPages = Math.ceil(totalFiltered / pageSize)
  const highlightedUserId = useMemo(() => debouncedSearch && paginatedEntries.length === 1 ? paginatedEntries[0].userId : null, [debouncedSearch, paginatedEntries])
  
  // Track leaderboard view on mount
  useEffect(() => {
    if (leaderboard?.playerEntry) {
      lbAnalytics.trackLeaderboardView(leaderboard.playerEntry.rank)
    } else if (leaderboard) {
      lbAnalytics.trackLeaderboardView()
    }
  }, [leaderboard?.playerEntry?.rank]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Track sort/filter changes
  useEffect(() => {
    if (sortBy !== 'distance') {
      lbAnalytics.trackFilterChange('sort', sortBy)
    }
  }, [sortBy]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Track scroll depth (max rank viewed)
  useEffect(() => {
    if (paginatedEntries.length > 0) {
      const maxRank = Math.max(...paginatedEntries.map(e => e.rank))
      lbAnalytics.trackLeaderboardScroll(maxRank)
    }
  }, [currentPage, paginatedEntries]) // eslint-disable-line react-hooks/exhaustive-deps
  
  const handleRefresh = () => {
    lbAnalytics.trackRefresh()
    refresh()
  }
  
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Survival Leaderboard</h1>
                <p className="text-xs text-neutral-500 mt-0.5">Global rankings</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ConnectionIndicator state={connectionState} lastUpdated={leaderboard?.lastUpdated} />
              <button onClick={handleRefresh} disabled={isLoading} className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium disabled:opacity-50 transition-all">
                {isLoading ? 'Syncing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6" key={updateKey}>
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatsCard label="Total Runs" value={stats.totalRuns} icon="🎮" />
            <StatsCard label="Players" value={stats.uniquePlayers} icon="👥" />
            <StatsCard label="Record Distance" value={Math.floor(stats.maxDistance)} suffix="m" icon="🏃" />
            <StatsCard label="Record Score" value={stats.maxScore} icon="⭐" />
          </div>
        )}
        
        {isAuthenticated && leaderboard?.playerEntry && <PlayerRankCard entry={leaderboard.playerEntry} totalPlayers={leaderboard.totalPlayers} />}
        
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="w-full md:w-72"><SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search players..." /></div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-orange-500/50">
            <option value="distance">Sort by Distance</option>
            <option value="score">Sort by Score</option>
            <option value="combo">Sort by Combo</option>
          </select>
        </div>
        
        <div className="space-y-2">
          {isLoading && !leaderboard ? <LoadingSkeleton count={pageSize} /> : paginatedEntries.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-neutral-400">{debouncedSearch ? 'No players found' : 'No leaderboard data yet'}</p>
            </div>
          ) : paginatedEntries.map((entry, index) => (
            <LeaderboardRow key={entry.userId} entry={entry} isCurrentUser={user?.id === entry.userId} isHighlighted={entry.userId === highlightedUserId} animationDelay={index * ANIMATION_STAGGER_MS} />
          ))}
        </div>
        
        {totalFiltered > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={setPageSize} totalItems={totalFiltered} />}
        
        {!isAuthenticated && (
          <div className="relative overflow-hidden bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-orange-500/10 rounded-2xl p-8 border border-orange-500/20 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Ready to compete?</h3>
            <p className="text-neutral-400 mb-6 max-w-md mx-auto">Sign in to track your runs and climb the leaderboard!</p>
            <button onClick={() => navigate('/login')} className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/25 transition-all">Sign In to Play</button>
          </div>
        )}
      </main>
      
      <style>{`@keyframes slideInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

export default SurvivalLeaderboard
