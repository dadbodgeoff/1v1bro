import { describe, it, expect } from 'vitest'
import { cn, formatTime, clamp } from './helpers'

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('filters falsy values', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c')
  })

  it('handles conditional classes', () => {
    const isActive = true
    expect(cn('base', isActive && 'active')).toBe('base active')
  })
})

describe('formatTime', () => {
  it('formats seconds correctly', () => {
    expect(formatTime(5000)).toBe('5s')
    expect(formatTime(30000)).toBe('30s')
  })

  it('formats minutes and seconds', () => {
    expect(formatTime(65000)).toBe('1:05')
    expect(formatTime(120000)).toBe('2:00')
  })

  it('rounds up milliseconds', () => {
    expect(formatTime(4500)).toBe('5s')
    expect(formatTime(4100)).toBe('5s')
  })
})

describe('clamp', () => {
  it('clamps value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })
})
