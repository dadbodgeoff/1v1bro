/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CanvasMock - Mock canvas context for render testing in E2E tests
 * 
 * @module __tests__/e2e/helpers/CanvasMock
 */

/**
 * Types of render operations tracked
 */
export type RenderOperationType = 
  | 'fillRect'
  | 'strokeRect'
  | 'clearRect'
  | 'fillText'
  | 'strokeText'
  | 'beginPath'
  | 'closePath'
  | 'moveTo'
  | 'lineTo'
  | 'arc'
  | 'fill'
  | 'stroke'
  | 'save'
  | 'restore'
  | 'translate'
  | 'rotate'
  | 'scale'
  | 'setTransform'
  | 'drawImage'

/**
 * A recorded render operation
 */
export interface RenderOperation {
  type: RenderOperationType
  args: any[]
  timestamp: number
  order: number
}

/**
 * Mock canvas context interface
 */
export interface CanvasMock {
  ctx: CanvasRenderingContext2D
  operations: RenderOperation[]
  
  /** Check if any drawing occurred */
  hasDrawn(): boolean
  
  /** Get operations in order */
  getOperationsInOrder(): RenderOperation[]
  
  /** Get operations of a specific type */
  getOperationsByType(type: RenderOperationType): RenderOperation[]
  
  /** Clear recorded operations */
  clear(): void
  
  /** Get operation count */
  getOperationCount(): number
}

/**
 * Create a mock canvas context that tracks render operations
 */
export function createCanvasMock(): CanvasMock {
  const operations: RenderOperation[] = []
  let operationOrder = 0
  
  const recordOperation = (type: RenderOperationType, args: any[] = []) => {
    operations.push({
      type,
      args,
      timestamp: Date.now(),
      order: operationOrder++
    })
  }
  
  // Create a mock context with all required methods
  const ctx = {
    // State
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt' as CanvasLineCap,
    lineJoin: 'miter' as CanvasLineJoin,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
    font: '10px sans-serif',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    
    // Canvas reference
    canvas: {
      width: 1280,
      height: 720
    } as HTMLCanvasElement,
    
    // Drawing methods
    fillRect: (...args: any[]) => recordOperation('fillRect', args),
    strokeRect: (...args: any[]) => recordOperation('strokeRect', args),
    clearRect: (...args: any[]) => recordOperation('clearRect', args),
    fillText: (...args: any[]) => recordOperation('fillText', args),
    strokeText: (...args: any[]) => recordOperation('strokeText', args),
    
    // Path methods
    beginPath: () => recordOperation('beginPath'),
    closePath: () => recordOperation('closePath'),
    moveTo: (...args: any[]) => recordOperation('moveTo', args),
    lineTo: (...args: any[]) => recordOperation('lineTo', args),
    arc: (...args: any[]) => recordOperation('arc', args),
    arcTo: () => {},
    bezierCurveTo: () => {},
    quadraticCurveTo: () => {},
    rect: () => {},
    ellipse: () => {},
    
    // Fill/stroke
    fill: () => recordOperation('fill'),
    stroke: () => recordOperation('stroke'),
    clip: () => {},
    
    // Transform methods
    save: () => recordOperation('save'),
    restore: () => recordOperation('restore'),
    translate: (...args: any[]) => recordOperation('translate', args),
    rotate: (...args: any[]) => recordOperation('rotate', args),
    scale: (...args: any[]) => recordOperation('scale', args),
    setTransform: (...args: any[]) => recordOperation('setTransform', args),
    getTransform: () => new DOMMatrix(),
    resetTransform: () => {},
    transform: () => {},
    
    // Image methods
    drawImage: (...args: any[]) => recordOperation('drawImage', args),
    createImageData: () => new ImageData(1, 1),
    getImageData: () => new ImageData(1, 1),
    putImageData: () => {},
    
    // Gradient/pattern
    createLinearGradient: () => ({
      addColorStop: () => {}
    }),
    createRadialGradient: () => ({
      addColorStop: () => {}
    }),
    createPattern: () => null,
    createConicGradient: () => ({
      addColorStop: () => {}
    }),
    
    // Text measurement
    measureText: () => ({
      width: 0,
      actualBoundingBoxAscent: 0,
      actualBoundingBoxDescent: 0,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: 0,
      fontBoundingBoxAscent: 0,
      fontBoundingBoxDescent: 0,
      emHeightAscent: 0,
      emHeightDescent: 0,
      hangingBaseline: 0,
      alphabeticBaseline: 0,
      ideographicBaseline: 0
    }),
    
    // Path checking
    isPointInPath: () => false,
    isPointInStroke: () => false,
    
    // Line dash
    setLineDash: () => {},
    getLineDash: () => [],
    lineDashOffset: 0,
    
    // Other
    direction: 'ltr' as CanvasDirection,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'low' as ImageSmoothingQuality,
    filter: 'none',
    getContextAttributes: () => ({}),
    drawFocusIfNeeded: () => {},
    scrollPathIntoView: () => {},
    roundRect: () => {},
    reset: () => {},
    isContextLost: () => false
  } as unknown as CanvasRenderingContext2D
  
  return {
    ctx,
    operations,
    
    hasDrawn(): boolean {
      return operations.length > 0
    },
    
    getOperationsInOrder(): RenderOperation[] {
      return [...operations].sort((a, b) => a.order - b.order)
    },
    
    getOperationsByType(type: RenderOperationType): RenderOperation[] {
      return operations.filter(op => op.type === type)
    },
    
    clear(): void {
      operations.length = 0
      operationOrder = 0
    },
    
    getOperationCount(): number {
      return operations.length
    }
  }
}

/**
 * Helper to verify render operations occurred in expected order
 */
export function verifyRenderOrder(
  mock: CanvasMock,
  expectedOrder: RenderOperationType[]
): boolean {
  const ops = mock.getOperationsInOrder()
  let expectedIndex = 0
  
  for (const op of ops) {
    if (op.type === expectedOrder[expectedIndex]) {
      expectedIndex++
      if (expectedIndex >= expectedOrder.length) {
        return true
      }
    }
  }
  
  return expectedIndex >= expectedOrder.length
}
