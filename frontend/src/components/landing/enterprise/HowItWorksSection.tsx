/**
 * HowItWorksSection - 3-step explanation section
 * 
 * Displays how the game works in 3 steps with connecting line.
 * 
 * @module landing/enterprise/HowItWorksSection
 * Requirements: 8.1, 8.3, 8.4, 8.5
 */

import { cn } from '@/utils/helpers'
import { SectionHeader } from './SectionHeader'
import { StepCard } from './StepCard'
import { TriviaIcon, FriendsIcon, BattlePassIcon } from './icons'

export interface HowItWorksSectionProps {
  /** Additional CSS classes */
  className?: string
}

const STEPS = [
  {
    number: 1,
    title: 'Pick a mode & topic',
    description: 'Choose Fortnite trivia, general knowledge, or custom categories and jump into a 1v1 match.',
    icon: <TriviaIcon size="lg" />,
  },
  {
    number: 2,
    title: 'Share a code, join instantly',
    description: 'Send your lobby code to a friend—both of you see the same arena in real time.',
    icon: <FriendsIcon size="lg" />,
  },
  {
    number: 3,
    title: 'Fight, answer, and level up',
    description: 'Move, shoot, grab power-ups, and answer faster to earn XP, coins, and bragging rights.',
    icon: <BattlePassIcon size="lg" />,
  },
]

export function HowItWorksSection({ className }: HowItWorksSectionProps) {
  return (
    <section
      className={cn(
        'relative py-20 md:py-[120px] bg-[#09090B]',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader title="How It Works" />

        {/* Steps Grid */}
        <div className="relative">
          {/* Connecting Line (desktop only) */}
          <div className="hidden md:block absolute top-[60px] left-[20%] right-[20%] h-px bg-white/[0.08]" />

          {/* Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {STEPS.map((step) => (
              <StepCard
                key={step.number}
                stepNumber={step.number}
                title={step.title}
                description={step.description}
                icon={step.icon}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
