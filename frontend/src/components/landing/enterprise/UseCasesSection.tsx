/**
 * UseCasesSection - "Perfect For..." audience section
 * 
 * Displays 3 use case cards for different audience segments.
 * 
 * @module landing/enterprise/UseCasesSection
 * Requirements: 9.1, 9.2, 9.4
 */

import { cn } from '@/utils/helpers'
import { SectionHeader } from './SectionHeader'
import { UseCaseCard } from './UseCaseCard'
import { FriendsIcon, CommunityIcon, EventIcon } from './icons'

export interface UseCasesSectionProps {
  /** Additional CSS classes */
  className?: string
}

const USE_CASES = [
  {
    id: 'friends',
    title: 'Friends hanging out online',
    description: 'Drop a code in Discord and decide every argument with a quick best-of-3.',
    icon: <FriendsIcon size="default" />,
  },
  {
    id: 'communities',
    title: 'Communities & servers',
    description: "Run pickup 1v1 tournaments or 'beat the mod' nights.",
    icon: <CommunityIcon size="default" />,
  },
  {
    id: 'events',
    title: 'Events & watch parties',
    description: 'Use trivia tied to live sports, shows, or streams to keep everyone engaged.',
    icon: <EventIcon size="default" />,
  },
]

export function UseCasesSection({ className }: UseCasesSectionProps) {
  return (
    <section
      className={cn(
        'relative py-20 md:py-[120px] bg-[#09090B]',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader title="Perfect For..." />

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {USE_CASES.map((useCase) => (
            <UseCaseCard
              key={useCase.id}
              icon={useCase.icon}
              title={useCase.title}
              description={useCase.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default UseCasesSection
