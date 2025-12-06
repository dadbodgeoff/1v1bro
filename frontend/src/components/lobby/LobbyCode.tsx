/**
 * LobbyCode - Clean code display with copy functionality
 */

import { useState } from 'react'

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
    <button
      onClick={handleCopy}
      className="group relative px-8 py-4 bg-white/[0.02] border border-white/[0.08] rounded-lg hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
    >
      <span className="text-3xl font-mono font-semibold tracking-[0.4em] text-white">
        {code}
      </span>
      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-neutral-500">
        {copied ? 'Copied!' : 'Click to copy'}
      </span>
    </button>
  )
}
