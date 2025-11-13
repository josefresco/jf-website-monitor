import { createHash } from 'crypto'
import { diffLines } from 'diff'

/**
 * Normalize HTML content by removing dynamic elements and whitespace
 */
export function normalizeHtml(html: string): string {
  let normalized = html

  // Remove HTML comments
  normalized = normalized.replace(/<!--[\s\S]*?-->/g, '')

  // Remove script tags with dynamic content
  normalized = normalized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

  // Remove style tags
  normalized = normalized.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  // Remove timestamps (various formats)
  normalized = normalized.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?/g,
    'TIMESTAMP'
  )

  // Remove CSRF tokens (meta tags)
  normalized = normalized.replace(
    /<meta[^>]*name=["']csrf-token["'][^>]*>/gi,
    ''
  )

  // Remove common dynamic attributes
  normalized = normalized.replace(/data-timestamp=["'][^"']*["']/gi, '')

  // Remove ad containers (common class/id patterns)
  const adPatterns = [
    /<div[^>]*class=["'][^"']*\b(ad|advertisement|banner)\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
    /<div[^>]*id=["'][^"']*\b(ad|advertisement|banner)\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
  ]

  adPatterns.forEach((pattern) => {
    normalized = normalized.replace(pattern, '')
  })

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim()

  return normalized
}

/**
 * Calculate SHA-256 hash of content
 */
export function calculateHash(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Calculate percentage of change between two HTML strings
 */
export function calculateChangePercent(
  oldHtml: string,
  newHtml: string
): number {
  const oldLines = oldHtml.split('\n')
  const newLines = newHtml.split('\n')

  const diff = diffLines(oldHtml, newHtml)

  let addedLines = 0
  let removedLines = 0
  const totalLines = Math.max(oldLines.length, newLines.length)

  diff.forEach((part) => {
    if (part.added) {
      addedLines += part.count || 0
    } else if (part.removed) {
      removedLines += part.count || 0
    }
  })

  const changedLines = addedLines + removedLines
  const changePercent = (changedLines / totalLines) * 100

  return Math.round(changePercent * 100) / 100 // 2 decimal places
}
