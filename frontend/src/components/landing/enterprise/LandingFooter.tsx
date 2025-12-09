/**
 * LandingFooter - Page footer with navigation and legal
 * 
 * Displays logo, navigation columns, and copyright.
 * 
 * @module landing/enterprise/LandingFooter
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { Link } from 'react-router-dom'
import { cn } from '@/utils/helpers'

export interface LandingFooterProps {
  /** Additional CSS classes */
  className?: string
}

const FOOTER_LINKS = {
  play: [
    { label: 'Try Free', href: '/play' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Leaderboards', href: '/leaderboards' },
    { label: 'Battle Pass', href: '/battlepass' },
  ],
  learn: [
    { label: 'How It Works', href: '#how-it-works', scroll: true },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refunds' },
  ],
}

export function LandingFooter({ className }: LandingFooterProps) {
  const handleScrollLink = (id: string) => {
    const element = document.getElementById(id.replace('#', ''))
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer
      className={cn(
        'bg-[#09090B] border-t border-white/[0.06]',
        'pt-20 pb-12',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          {/* Logo & Tagline */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-[24px] font-bold text-white">
              1v1 Bro
            </Link>
            <p className="mt-4 text-[14px] leading-[22px] text-[#737373] max-w-xs">
              Trivia duels with real-time combat. Prove your knowledge in the arena.
            </p>
          </div>

          {/* Play Links */}
          <div>
            <h3 className="text-[14px] font-semibold text-white mb-4">Play</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.play.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-[14px] text-[#737373] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn Links */}
          <div>
            <h3 className="text-[14px] font-semibold text-white mb-4">Learn</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.learn.map((link) => (
                <li key={link.label}>
                  {link.scroll ? (
                    <button
                      onClick={() => handleScrollLink(link.href)}
                      className="text-[14px] text-[#737373] hover:text-white transition-colors"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-[14px] text-[#737373] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-[14px] font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-[14px] text-[#737373] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/[0.06]">
          <p className="text-[13px] text-[#737373] text-center md:text-left">
            © 2025 1v1 Bro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter
