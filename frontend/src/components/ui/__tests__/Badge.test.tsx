/**
 * Property-based tests for Badge component accessibility.
 *
 * Tests correctness properties for rarity badge aria-labels.
 *
 * **Feature: ui-polish-8-of-10**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { render, screen } from '@testing-library/react'
import { Badge, RarityBadge, getRarityAriaLabel, type RarityVariant } from '../Badge'

// ============================================
// Property 8: Rarity badges have descriptive aria-labels
// ============================================

describe('Property 8: Rarity badges have descriptive aria-labels', () => {
  /**
   * **Feature: ui-polish-8-of-10, Property 8: Rarity badges have descriptive aria-labels**
   *
   * For any rarity value in ['common', 'uncommon', 'rare', 'epic', 'legendary'],
   * the Badge component should render with an aria-label containing that rarity name.
   *
   * **Validates: Requirements 3.3**
   */

  const RARITY_VALUES: RarityVariant[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

  it('should render RarityBadge with aria-label for each rarity', () => {
    RARITY_VALUES.forEach((rarity) => {
      const { container } = render(<RarityBadge rarity={rarity} />)
      const badge = container.querySelector('span')
      
      expect(badge).toHaveAttribute('aria-label')
      // Case-insensitive check
      const ariaLabel = badge?.getAttribute('aria-label')?.toLowerCase() ?? ''
      expect(ariaLabel).toContain(rarity.toLowerCase())
      
      container.remove()
    })
  })

  it('property: every rarity has a descriptive aria-label', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RARITY_VALUES),
        (rarity) => {
          const { container } = render(<RarityBadge rarity={rarity} />)
          const badge = container.querySelector('span')
          
          const hasAriaLabel = badge?.hasAttribute('aria-label') ?? false
          const ariaLabel = badge?.getAttribute('aria-label') ?? ''
          const containsRarity = ariaLabel.toLowerCase().includes(rarity.toLowerCase())
          
          container.remove()
          
          return hasAriaLabel && containsRarity
        }
      ),
      { numRuns: 10 }
    )
  })

  it('property: getRarityAriaLabel returns string containing rarity name', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RARITY_VALUES),
        (rarity) => {
          const ariaLabel = getRarityAriaLabel(rarity)
          return (
            typeof ariaLabel === 'string' &&
            ariaLabel.length > 0 &&
            ariaLabel.toLowerCase().includes(rarity.toLowerCase())
          )
        }
      ),
      { numRuns: 10 }
    )
  })

  it('property: aria-label includes "rarity" or "item" for context', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RARITY_VALUES),
        (rarity) => {
          const ariaLabel = getRarityAriaLabel(rarity)
          const hasContext = 
            ariaLabel.toLowerCase().includes('rarity') ||
            ariaLabel.toLowerCase().includes('item')
          return hasContext
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should allow custom aria-label on Badge component', () => {
    const customLabel = 'Custom accessibility label'
    render(<Badge aria-label={customLabel}>Test</Badge>)
    
    const badge = screen.getByText('Test')
    expect(badge).toHaveAttribute('aria-label', customLabel)
  })
})

// ============================================
// Badge Rendering Tests
// ============================================

describe('Badge rendering', () => {
  it('should render with default variant', () => {
    render(<Badge>Default</Badge>)
    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('should render with rarity variants', () => {
    const rarities: RarityVariant[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
    
    rarities.forEach((rarity) => {
      const { container } = render(<Badge variant={rarity}>{rarity}</Badge>)
      expect(container.querySelector('span')).toBeInTheDocument()
      container.remove()
    })
  })

  it('should render with shimmer effect for legendary', () => {
    const { container } = render(
      <Badge variant="legendary" shimmer>
        Legendary
      </Badge>
    )
    
    // Should have shimmer span
    const shimmerSpan = container.querySelector('.legendary-shimmer')
    expect(shimmerSpan).toBeInTheDocument()
  })

  it('should render with different sizes', () => {
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']
    
    sizes.forEach((size) => {
      const { container } = render(<Badge size={size}>Size {size}</Badge>)
      expect(container.querySelector('span')).toBeInTheDocument()
      container.remove()
    })
  })
})

// ============================================
// RarityBadge Tests
// ============================================

describe('RarityBadge', () => {
  it('should render correct label text for each rarity', () => {
    const expectedLabels: Record<RarityVariant, string> = {
      common: 'Common',
      uncommon: 'Uncommon',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary',
    }

    Object.entries(expectedLabels).forEach(([rarity, label]) => {
      const { container } = render(<RarityBadge rarity={rarity as RarityVariant} />)
      expect(container.textContent).toBe(label)
      container.remove()
    })
  })

  it('should enable shimmer for legendary when shimmer prop is true', () => {
    const { container } = render(<RarityBadge rarity="legendary" shimmer />)
    const shimmerSpan = container.querySelector('.legendary-shimmer')
    expect(shimmerSpan).toBeInTheDocument()
  })

  it('should not enable shimmer for non-legendary even when shimmer prop is true', () => {
    const { container } = render(<RarityBadge rarity="epic" shimmer />)
    const shimmerSpan = container.querySelector('.legendary-shimmer')
    expect(shimmerSpan).not.toBeInTheDocument()
  })
})
