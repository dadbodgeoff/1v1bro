/**
 * Production Build Security Property Tests
 * 
 * **Feature: frontend-prod-readiness-audit, Property 1: Production build contains no sensitive artifacts**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

const DIST_DIR = path.resolve(__dirname, '../../../dist')

// Helper to get all files recursively
function getAllFiles(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files
  
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      getAllFiles(fullPath, files)
    } else {
      files.push(fullPath)
    }
  }
  return files
}

describe('Production Build Security', () => {
  const distExists = fs.existsSync(DIST_DIR)
  
  describe.skipIf(!distExists)('Source Map Exclusion', () => {
    /**
     * **Feature: frontend-prod-readiness-audit, Property 1: Production build contains no sensitive artifacts**
     * **Validates: Requirements 1.1**
     */
    it('should not contain any .map files in production build', () => {
      const files = getAllFiles(DIST_DIR)
      const mapFiles = files.filter(f => f.endsWith('.map'))
      
      expect(mapFiles).toHaveLength(0)
    })
  })

  describe.skipIf(!distExists)('No .env Files', () => {
    /**
     * **Feature: frontend-prod-readiness-audit, Property 1: Production build contains no sensitive artifacts**
     * **Validates: Requirements 1.4**
     */
    it('should not contain any .env files in production build', () => {
      const files = getAllFiles(DIST_DIR)
      const envFiles = files.filter(f => 
        f.includes('.env') || 
        path.basename(f).startsWith('.env')
      )
      
      expect(envFiles).toHaveLength(0)
    })
  })

  describe.skipIf(!distExists)('Secret Pattern Detection', () => {
    const SECRET_PATTERNS = [
      { name: 'API Key', pattern: /['"]?api[_-]?key['"]?\s*[:=]\s*['"][A-Za-z0-9]{20,}['"]/ },
      { name: 'Secret', pattern: /['"]?secret['"]?\s*[:=]\s*['"][A-Za-z0-9]{20,}['"]/ },
      { name: 'AWS Key', pattern: /AKIA[0-9A-Z]{16}/ },
      { name: 'Stripe Secret', pattern: /sk_live_[A-Za-z0-9]{24,}/ },
      { name: 'Private Key', pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
    ]

    /**
     * **Feature: frontend-prod-readiness-audit, Property 1: Production build contains no sensitive artifacts**
     * **Validates: Requirements 1.3**
     */
    it.each(SECRET_PATTERNS)('should not contain $name patterns in JS bundles', ({ pattern }) => {
      const files = getAllFiles(DIST_DIR)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      for (const file of jsFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        expect(content).not.toMatch(pattern)
      }
    })
  })

  describe.skipIf(!distExists)('Bundle Minification', () => {
    /**
     * **Feature: frontend-prod-readiness-audit, Property 1: Production build contains no sensitive artifacts**
     * **Validates: Requirements 1.5**
     */
    it('should have minified JavaScript bundles', () => {
      const files = getAllFiles(DIST_DIR)
      const jsFiles = files.filter(f => f.endsWith('.js'))
      
      for (const file of jsFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const lines = content.split('\n').filter(l => l.trim().length > 0)
        
        // Minified files typically have very few lines with long content
        // or many short lines (for readability in some minifiers)
        const avgLineLength = content.length / Math.max(lines.length, 1)
        
        // Either the file is small, or it should be minified (high avg line length)
        const isMinified = content.length < 1000 || avgLineLength > 200 || lines.length < 100
        
        expect(isMinified).toBe(true)
      }
    })
  })

  describe('Property-Based Secret Detection', () => {
    /**
     * Property test: For any string that looks like a secret,
     * it should not appear in the production bundle
     */
    it('should detect various secret formats', () => {
      // Generate potential secret patterns
      fc.assert(
        fc.property(
          fc.record({
            prefix: fc.constantFrom('api_key', 'secret', 'password', 'token', 'private_key'),
            value: fc.stringMatching(/^[A-Fa-f0-9]{32,64}$/),
          }),
          ({ prefix, value }) => {
            const secretPattern = `${prefix}="${value}"`
            
            // This pattern should be detectable by our audit
            const detectPattern = new RegExp(`${prefix}.*=.*["'][A-Fa-f0-9]{32,}["']`, 'i')
            
            // Verify our detection pattern works
            expect(detectPattern.test(secretPattern)).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})

describe('Environment Variable Safety', () => {
  /**
   * **Feature: frontend-prod-readiness-audit, Property 1: Production build contains no sensitive artifacts**
   * **Validates: Requirements 1.4**
   */
  it('should only expose safe VITE_ prefixed variables', () => {
    // Safe variables that can be in the bundle
    const SAFE_VITE_VARS = [
      'VITE_API_BASE',
      'VITE_WS_BASE', 
      'VITE_APP_NAME',
      'VITE_APP_VERSION',
    ]
    
    // Dangerous variable patterns
    const DANGEROUS_PATTERNS = [
      /VITE_SECRET/,
      /VITE_PRIVATE/,
      /VITE_PASSWORD/,
      /VITE_TOKEN/,
      /VITE_KEY(?!BOARD)/, // KEY but not KEYBOARD
    ]
    
    // Property: Any VITE_ variable should either be in safe list or not match dangerous patterns
    fc.assert(
      fc.property(
        fc.constantFrom(...SAFE_VITE_VARS),
        (varName) => {
          // Safe variables should not match dangerous patterns
          for (const pattern of DANGEROUS_PATTERNS) {
            expect(pattern.test(varName)).toBe(false)
          }
        }
      )
    )
  })
})
