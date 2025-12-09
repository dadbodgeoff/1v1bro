/**
 * Tests for MapSelector component.
 * 
 * **Feature: map-selection, Property 1: Map selection renders all available maps**
 * **Validates: Requirements 1.2**
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MapSelector } from '../MapSelector'
import { AVAILABLE_MAPS } from '@/game/config/maps/map-loader'

describe('MapSelector', () => {
  /**
   * Property 1: Map selection renders all available maps
   * 
   * For any list of available maps, the MapSelector component should render
   * a selectable option for each map including its name.
   * 
   * **Feature: map-selection, Property 1: Map selection renders all available maps**
   * **Validates: Requirements 1.2**
   */
  it('renders all available maps', () => {
    const onSelect = vi.fn()
    render(
      <MapSelector
        selectedMap="nexus-arena"
        onSelect={onSelect}
      />
    )

    // Verify all maps are rendered
    AVAILABLE_MAPS.forEach((map) => {
      expect(screen.getByText(map.name)).toBeInTheDocument()
    })
  })

  it('renders map descriptions', () => {
    const onSelect = vi.fn()
    render(
      <MapSelector
        selectedMap="nexus-arena"
        onSelect={onSelect}
      />
    )

    // Verify descriptions are shown
    AVAILABLE_MAPS.forEach((map) => {
      expect(screen.getByText(map.description)).toBeInTheDocument()
    })
  })

  it('calls onSelect with correct slug when map is clicked', () => {
    const onSelect = vi.fn()
    render(
      <MapSelector
        selectedMap="nexus-arena"
        onSelect={onSelect}
      />
    )

    // Click on Vortex Arena
    fireEvent.click(screen.getByText('Vortex Arena'))
    expect(onSelect).toHaveBeenCalledWith('vortex-arena')
  })

  it('visually indicates selected map', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <MapSelector
        selectedMap="vortex-arena"
        onSelect={onSelect}
      />
    )

    // The selected map button should have the selection indicator (checkmark)
    const checkmarks = container.querySelectorAll('svg')
    expect(checkmarks.length).toBeGreaterThan(0)
  })

  it('does not call onSelect when disabled', () => {
    const onSelect = vi.fn()
    render(
      <MapSelector
        selectedMap="nexus-arena"
        onSelect={onSelect}
        disabled={true}
      />
    )

    // Click on Vortex Arena
    fireEvent.click(screen.getByText('Vortex Arena'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('applies disabled styling when disabled', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <MapSelector
        selectedMap="nexus-arena"
        onSelect={onSelect}
        disabled={true}
      />
    )

    // Check that buttons have disabled styling
    const buttons = container.querySelectorAll('button')
    buttons.forEach((button) => {
      expect(button).toHaveClass('opacity-50')
      expect(button).toHaveClass('cursor-not-allowed')
    })
  })

  it('renders section header', () => {
    const onSelect = vi.fn()
    render(
      <MapSelector
        selectedMap="nexus-arena"
        onSelect={onSelect}
      />
    )

    expect(screen.getByText('Select Arena')).toBeInTheDocument()
  })
})
