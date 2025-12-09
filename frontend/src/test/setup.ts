import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock localStorage for Zustand persist middleware
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock IntersectionObserver for components using lazy loading
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  private callback: IntersectionObserverCallback
  
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }
  
  observe = vi.fn((target: Element) => {
    // Immediately trigger as visible
    const entry: IntersectionObserverEntry = {
      boundingClientRect: target.getBoundingClientRect?.() || {} as DOMRectReadOnly,
      intersectionRatio: 1,
      intersectionRect: {} as DOMRectReadOnly,
      isIntersecting: true,
      rootBounds: null,
      target,
      time: Date.now(),
    }
    this.callback([entry], this)
  })
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true,
})
