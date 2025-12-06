/**
 * Register - Clean registration page
 */

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'

export function Register() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await authAPI.register({
        email,
        password,
        display_name: displayName || undefined,
      })
      setUser(response.user, response.access_token)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
            Create account
          </h1>
          <p className="text-sm text-neutral-500">Get started with 1v1 Bro</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs text-neutral-500 mb-2">
              Display Name <span className="text-neutral-600">(optional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your nickname"
              autoComplete="username"
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/[0.2] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/[0.2] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/[0.2] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/[0.2] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
