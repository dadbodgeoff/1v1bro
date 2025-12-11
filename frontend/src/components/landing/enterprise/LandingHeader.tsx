/**
 * LandingHeader - Fixed navigation header
 * 
 * Displays logo, navigation links, and auth buttons.
 * Includes mobile hamburger menu.
 * 
 * @module landing/enterprise/LandingHeader
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/helpers'
import { useAuthStore } from '@/stores/authStore'
import { CTAButton } from './CTAButton'
import { MenuIcon, CloseIcon } from './icons'

export interface LandingHeaderProps {
  /** Additional CSS classes */
  className?: string
}

export function LandingHeader({ className }: LandingHeaderProps) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogin = () => {
    navigate('/login')
    setMobileMenuOpen(false)
  }

  const handleSignup = () => {
    navigate('/register')
    setMobileMenuOpen(false)
  }

  const handleDashboard = () => {
    navigate('/dashboard')
    setMobileMenuOpen(false)
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-[100]',
          'h-16 md:h-20',
          'bg-[#09090B]/95 backdrop-blur-xl',
          'border-b border-white/[0.06]',
          className
        )}
      >
        <nav className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-[24px] md:text-[28px] font-bold tracking-[-0.02em] text-white hover:text-white/90 transition-colors"
          >
            1v1 Bro
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Nav Links */}
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-[15px] font-medium text-[#B4B4B4] hover:text-white transition-colors"
            >
              How It Works
            </button>
            <Link
              to="/leaderboards"
              className="text-[15px] font-medium text-[#B4B4B4] hover:text-white transition-colors"
            >
              Leaderboards
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4 ml-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-[#737373]">
                    {user?.email?.split('@')[0]}
                  </span>
                  <CTAButton variant="primary" onClick={handleDashboard}>
                    Dashboard
                  </CTAButton>
                </>
              ) : (
                <>
                  <CTAButton variant="tertiary" onClick={handleLogin}>
                    Log in
                  </CTAButton>
                  <CTAButton variant="primary" onClick={handleSignup}>
                    Sign up
                  </CTAButton>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[99] bg-[#0A0A0B] pt-16 md:hidden">
          <nav className="flex flex-col items-center justify-center h-full gap-8 px-6">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-xl text-white min-h-[44px] px-4"
            >
              How It Works
            </button>
            <Link
              to="/leaderboards"
              className="text-xl text-white min-h-[44px] px-4 flex items-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Leaderboards
            </Link>

            <div className="flex flex-col gap-4 w-full max-w-xs mt-8">
              {isAuthenticated ? (
                <CTAButton variant="primary" size="large" onClick={handleDashboard}>
                  Dashboard
                </CTAButton>
              ) : (
                <>
                  <CTAButton variant="primary" size="large" onClick={handleSignup}>
                    Sign up
                  </CTAButton>
                  <CTAButton variant="secondary" size="large" onClick={handleLogin}>
                    Log in
                  </CTAButton>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}

export default LandingHeader
