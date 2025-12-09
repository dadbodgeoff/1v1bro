/**
 * Production Build Audit Script
 * 
 * Scans the production build output for security issues:
 * - Source map files (.map)
 * - Console.log statements in bundles
 * - Hardcoded secrets/credentials
 * - Exposed environment variables
 * 
 * **Feature: frontend-prod-readiness-audit, Property 1: Production build contains no sensitive artifacts**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 */

import * as fs from 'fs'
import * as path from 'path'

interface AuditResult {
  category: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string[]
  priority: 'critical' | 'high' | 'medium' | 'low'
}

const DIST_DIR = path.resolve(__dirname, '../dist')

// Patterns that indicate potential secrets
const SECRET_PATTERNS = [
  /['"]?api[_-]?key['"]?\s*[:=]\s*['"][^'"]{10,}['"]/gi,
  /['"]?secret['"]?\s*[:=]\s*['"][^'"]{10,}['"]/gi,
  /['"]?password['"]?\s*[:=]\s*['"][^'"]{6,}['"]/gi,
  /['"]?token['"]?\s*[:=]\s*['"][^'"]{20,}['"]/gi,
  /['"]?private[_-]?key['"]?\s*[:=]\s*['"][^'"]{20,}['"]/gi,
  /['"]?aws[_-]?access[_-]?key['"]?\s*[:=]\s*['"][A-Z0-9]{16,}['"]/gi,
  /['"]?stripe[_-]?(?:secret|publishable)[_-]?key['"]?\s*[:=]\s*['"]sk_[^'"]+['"]/gi,
]

// Environment variables that should NOT be in production bundles
const SENSITIVE_ENV_PATTERNS = [
  /VITE_(?:SECRET|PRIVATE|PASSWORD|TOKEN|KEY)[A-Z_]*/g,
  /process\.env\.[A-Z_]+/g,
]

// Console patterns to detect
const CONSOLE_PATTERNS = [
  /console\.log\s*\(/g,
  /console\.debug\s*\(/g,
  /console\.info\s*\(/g,
]

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

function checkSourceMaps(): AuditResult {
  const files = getAllFiles(DIST_DIR)
  const mapFiles = files.filter(f => f.endsWith('.map'))
  
  if (mapFiles.length > 0) {
    return {
      category: 'security',
      status: 'fail',
      message: `Found ${mapFiles.length} source map file(s) in production build`,
      details: mapFiles.map(f => path.relative(DIST_DIR, f)),
      priority: 'critical',
    }
  }
  
  return {
    category: 'security',
    status: 'pass',
    message: 'No source maps found in production build',
    priority: 'critical',
  }
}

function checkConsoleLogs(): AuditResult {
  const files = getAllFiles(DIST_DIR)
  const jsFiles = files.filter(f => f.endsWith('.js'))
  const findings: string[] = []
  
  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    for (const pattern of CONSOLE_PATTERNS) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        // Check if it's not minified (has readable console.log)
        // Minified code typically has very short variable names
        const hasReadableConsole = /console\s*\.\s*log\s*\(/.test(content)
        if (hasReadableConsole) {
          findings.push(`${path.relative(DIST_DIR, file)}: ${matches.length} console statement(s)`)
        }
      }
    }
  }
  
  if (findings.length > 0) {
    return {
      category: 'security',
      status: 'warning',
      message: `Found console statements in ${findings.length} file(s)`,
      details: findings,
      priority: 'medium',
    }
  }
  
  return {
    category: 'security',
    status: 'pass',
    message: 'No unminified console statements found',
    priority: 'medium',
  }
}

function checkSecrets(): AuditResult {
  const files = getAllFiles(DIST_DIR)
  const jsFiles = files.filter(f => f.endsWith('.js'))
  const findings: string[] = []
  
  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    for (const pattern of SECRET_PATTERNS) {
      const matches = content.match(pattern)
      if (matches) {
        for (const match of matches) {
          // Mask the actual value
          const masked = match.replace(/(['"])[^'"]{10,}(['"])/, '$1[REDACTED]$2')
          findings.push(`${path.relative(DIST_DIR, file)}: ${masked}`)
        }
      }
    }
  }
  
  if (findings.length > 0) {
    return {
      category: 'security',
      status: 'fail',
      message: `Found ${findings.length} potential secret(s) in production build`,
      details: findings,
      priority: 'critical',
    }
  }
  
  return {
    category: 'security',
    status: 'pass',
    message: 'No hardcoded secrets detected',
    priority: 'critical',
  }
}

function checkEnvVariables(): AuditResult {
  const files = getAllFiles(DIST_DIR)
  const jsFiles = files.filter(f => f.endsWith('.js'))
  const findings: string[] = []
  
  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    for (const pattern of SENSITIVE_ENV_PATTERNS) {
      const matches = content.match(pattern)
      if (matches) {
        for (const match of matches) {
          // Filter out false positives (common safe env vars)
          if (!match.includes('VITE_API_BASE') && !match.includes('NODE_ENV')) {
            findings.push(`${path.relative(DIST_DIR, file)}: ${match}`)
          }
        }
      }
    }
  }
  
  if (findings.length > 0) {
    return {
      category: 'security',
      status: 'warning',
      message: `Found ${findings.length} potentially sensitive env variable reference(s)`,
      details: findings,
      priority: 'high',
    }
  }
  
  return {
    category: 'security',
    status: 'pass',
    message: 'No sensitive environment variables exposed',
    priority: 'high',
  }
}

function checkMinification(): AuditResult {
  const files = getAllFiles(DIST_DIR)
  const jsFiles = files.filter(f => f.endsWith('.js') && !f.includes('chunk'))
  
  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')
    
    // Check if file appears to be minified (few lines, long lines)
    const avgLineLength = content.length / lines.length
    if (avgLineLength < 100 && lines.length > 50) {
      return {
        category: 'security',
        status: 'warning',
        message: `File ${path.relative(DIST_DIR, file)} may not be properly minified`,
        priority: 'medium',
      }
    }
  }
  
  return {
    category: 'security',
    status: 'pass',
    message: 'All JavaScript files appear to be minified',
    priority: 'medium',
  }
}

function checkEnvFiles(): AuditResult {
  const files = getAllFiles(DIST_DIR)
  const envFiles = files.filter(f => 
    f.includes('.env') || 
    f.endsWith('.env.local') || 
    f.endsWith('.env.production')
  )
  
  if (envFiles.length > 0) {
    return {
      category: 'security',
      status: 'fail',
      message: `Found ${envFiles.length} .env file(s) in production build`,
      details: envFiles.map(f => path.relative(DIST_DIR, f)),
      priority: 'critical',
    }
  }
  
  return {
    category: 'security',
    status: 'pass',
    message: 'No .env files in production build',
    priority: 'critical',
  }
}

export function runAudit(): AuditResult[] {
  console.log('🔍 Running Production Build Security Audit...\n')
  
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist directory not found. Run `npm run build` first.')
    process.exit(1)
  }
  
  const results: AuditResult[] = [
    checkSourceMaps(),
    checkConsoleLogs(),
    checkSecrets(),
    checkEnvVariables(),
    checkMinification(),
    checkEnvFiles(),
  ]
  
  // Print results
  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
    console.log(`${icon} [${result.priority.toUpperCase()}] ${result.message}`)
    if (result.details && result.details.length > 0) {
      for (const detail of result.details.slice(0, 5)) {
        console.log(`   - ${detail}`)
      }
      if (result.details.length > 5) {
        console.log(`   ... and ${result.details.length - 5} more`)
      }
    }
  }
  
  // Summary
  const failures = results.filter(r => r.status === 'fail')
  const warnings = results.filter(r => r.status === 'warning')
  
  console.log('\n📊 Summary:')
  console.log(`   Passed: ${results.filter(r => r.status === 'pass').length}`)
  console.log(`   Warnings: ${warnings.length}`)
  console.log(`   Failures: ${failures.length}`)
  
  if (failures.length > 0) {
    console.log('\n❌ AUDIT FAILED - Critical security issues found')
    process.exit(1)
  } else if (warnings.length > 0) {
    console.log('\n⚠️ AUDIT PASSED WITH WARNINGS')
  } else {
    console.log('\n✅ AUDIT PASSED - No security issues found')
  }
  
  return results
}

// Run if executed directly
if (require.main === module) {
  runAudit()
}
