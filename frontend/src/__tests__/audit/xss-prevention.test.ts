/**
 * XSS Prevention Property Tests
 * 
 * **Feature: frontend-prod-readiness-audit, Property 8: XSS prevention - no unsanitized dynamic HTML**
 * **Validates: Requirements 2.5**
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const SRC_DIR = path.resolve(__dirname, '../../')

function getAllFiles(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files
  
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('dist')) {
      getAllFiles(fullPath, files)
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }
  return files
}

describe('XSS Prevention', () => {
  /**
   * **Feature: frontend-prod-readiness-audit, Property 8: XSS prevention - no unsanitized dynamic HTML**
   * **Validates: Requirements 2.5**
   */
  describe('dangerouslySetInnerHTML Usage', () => {
    it('should not use dangerouslySetInnerHTML without sanitization', () => {
      const files = getAllFiles(SRC_DIR)
      const tsxFiles = files.filter(f => f.endsWith('.tsx'))
      const violations: string[] = []
      
      for (const file of tsxFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        
        // Check for dangerouslySetInnerHTML
        if (content.includes('dangerouslySetInnerHTML')) {
          // Check if it's sanitized (common sanitization libraries)
          const hasSanitization = 
            content.includes('DOMPurify') ||
            content.includes('sanitize') ||
            content.includes('xss') ||
            content.includes('escape')
          
          if (!hasSanitization) {
            violations.push(path.relative(SRC_DIR, file))
          }
        }
      }
      
      expect(violations).toHaveLength(0)
    })
  })

  describe('innerHTML Usage', () => {
    it('should not directly set innerHTML on DOM elements', () => {
      const files = getAllFiles(SRC_DIR)
      const tsFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
      const violations: string[] = []
      
      for (const file of tsFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        
        // Check for direct innerHTML assignment (not React's dangerouslySetInnerHTML)
        const innerHTMLPattern = /\.innerHTML\s*=/g
        const matches = content.match(innerHTMLPattern)
        
        if (matches && matches.length > 0) {
          // Check if it's in a test file (acceptable)
          if (!file.includes('.test.') && !file.includes('__tests__')) {
            violations.push(`${path.relative(SRC_DIR, file)}: ${matches.length} innerHTML assignment(s)`)
          }
        }
      }
      
      expect(violations).toHaveLength(0)
    })
  })

  describe('eval Usage', () => {
    it('should not use eval or Function constructor with dynamic strings', () => {
      const files = getAllFiles(SRC_DIR)
      // Exclude test files from this check
      const tsFiles = files.filter(f => 
        (f.endsWith('.ts') || f.endsWith('.tsx')) && 
        !f.includes('.test.') && 
        !f.includes('__tests__')
      )
      const violations: string[] = []
      
      for (const file of tsFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        
        // Check for eval usage
        if (/\beval\s*\(/.test(content)) {
          violations.push(`${path.relative(SRC_DIR, file)}: eval() usage`)
        }
        
        // Check for new Function with dynamic content
        if (/new\s+Function\s*\([^)]*\+/.test(content)) {
          violations.push(`${path.relative(SRC_DIR, file)}: new Function() with dynamic content`)
        }
      }
      
      expect(violations).toHaveLength(0)
    })
  })

  describe('URL Injection Prevention', () => {
    it('should not construct URLs with unsanitized user input', () => {
      const files = getAllFiles(SRC_DIR)
      const tsFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
      const violations: string[] = []
      
      for (const file of tsFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        
        // Check for javascript: protocol in href
        if (/href\s*=\s*[`'"]javascript:/i.test(content)) {
          violations.push(`${path.relative(SRC_DIR, file)}: javascript: protocol in href`)
        }
        
        // Check for data: protocol in src (except for images)
        if (/src\s*=\s*[`'"]data:(?!image)/i.test(content)) {
          violations.push(`${path.relative(SRC_DIR, file)}: non-image data: protocol in src`)
        }
      }
      
      expect(violations).toHaveLength(0)
    })
  })
})
