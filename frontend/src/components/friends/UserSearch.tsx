/**
 * UserSearch - Search and add friends
 * Enterprise-style design
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useFriends } from '@/hooks/useFriends'
import type { UserSearchResult } from '@/types/friend'

export function UserSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const { searchUsers, sendFriendRequest } = useFriends()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    try {
      const data = await searchUsers(searchQuery)
      setResults(data.users)
      setHasSearched(true)
    } catch {
      // ignore
    } finally {
      setIsSearching(false)
    }
  }, [searchUsers])

  const handleInputChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleSearch(value), 300)
  }

  return (
    <div className="px-4 py-4">
      {/* Search input */}
      <div className="relative mb-4">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Search by username..."
          className="w-full pl-10 pr-8 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/[0.15] transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setHasSearched(false)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Empty state */}
      {!hasSearched && query.length < 2 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-white mb-1">Find Players</h3>
          <p className="text-xs text-neutral-500 max-w-[200px]">
            Enter at least 2 characters to search
          </p>
        </div>
      )}

      {/* No results */}
      {hasSearched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-white mb-1">No players found</h3>
          <p className="text-xs text-neutral-500">Try a different search term</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((user) => (
            <SearchResultCard key={user.id} user={user} onSendRequest={sendFriendRequest} />
          ))}
        </div>
      )}
    </div>
  )
}

interface SearchResultCardProps {
  user: UserSearchResult
  onSendRequest: (userId: string) => Promise<unknown>
}

function SearchResultCard({ user, onSendRequest }: SearchResultCardProps) {
  const [requestState, setRequestState] = useState<'idle' | 'sending' | 'sent' | 'friends'>(
    user.relationship_status === 'accepted' ? 'friends' : 
    user.relationship_status === 'pending' ? 'sent' : 'idle'
  )

  const handleSendRequest = async () => {
    if (requestState !== 'idle') return
    setRequestState('sending')
    try {
      const result = await onSendRequest(user.id) as { status: string }
      setRequestState(result.status === 'accepted' ? 'friends' : 'sent')
    } catch {
      setRequestState('idle')
    }
  }

  return (
    <div className="flex items-center gap-3 p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg hover:bg-white/[0.04] transition-colors">
      <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden flex-shrink-0">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-neutral-500 font-medium">
            {(user.display_name || 'U')[0].toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{user.display_name || 'Unknown'}</p>
      </div>

      {requestState === 'friends' ? (
        <span className="px-2.5 py-1 text-xs text-emerald-400 bg-emerald-500/10 rounded">Friends</span>
      ) : requestState === 'sent' ? (
        <span className="px-2.5 py-1 text-xs text-neutral-400 bg-white/[0.04] rounded">Pending</span>
      ) : (
        <button
          onClick={handleSendRequest}
          disabled={requestState === 'sending'}
          className="px-2.5 py-1 text-xs font-medium bg-white text-black rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors"
        >
          {requestState === 'sending' ? '...' : 'Add'}
        </button>
      )}
    </div>
  )
}
