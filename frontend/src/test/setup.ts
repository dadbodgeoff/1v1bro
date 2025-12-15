import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock matchMedia for device detection and responsive queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock visualViewport for mobile viewport handling
Object.defineProperty(window, 'visualViewport', {
  writable: true,
  value: {
    width: 1024,
    height: 768,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    scale: 1,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
})

// Mock navigator.vibrate for haptic feedback
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn(() => true),
})

// Mock navigator.wakeLock for screen wake lock
Object.defineProperty(navigator, 'wakeLock', {
  writable: true,
  value: {
    request: vi.fn().mockResolvedValue({
      released: false,
      release: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  },
})

// Mock screen.orientation for orientation lock
Object.defineProperty(screen, 'orientation', {
  writable: true,
  value: {
    type: 'landscape-primary',
    angle: 0,
    lock: vi.fn().mockResolvedValue(undefined),
    unlock: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
})

// Mock requestAnimationFrame for animation tests
if (typeof window.requestAnimationFrame === 'undefined') {
  window.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(() => callback(performance.now()), 16) as unknown as number
  })
}

if (typeof window.cancelAnimationFrame === 'undefined') {
  window.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id)
  })
}

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
