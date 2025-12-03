import { useState } from 'react'
import { cn } from '@/utils/helpers'

interface LobbyCodeProps {
  code: string
}

export function LobbyCode({ code }: LobbyCodeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = code
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="text-center">
      <p className="text-slate-400 text-sm mb-2">Lobby Code</p>
      <button
        onClick={handleCopy}
        className={cn(
          'text-4xl font-mono font-bold tracking-widest px-6 py-3 rounded-lg transition-colors',
          'bg-slate-800 hover:bg-slate-700',
          copied ? 'text-green-400' : 'text-white'
        )}
      >
        {code}
      </button>
      <p className="text-slate-500 text-xs mt-2">
        {copied ? 'Copied!' : 'Click to copy'}
      </p>
    </div>
  )
}
