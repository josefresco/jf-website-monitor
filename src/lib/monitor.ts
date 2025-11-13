import axios from 'axios'
import { Website, Check, IncidentType } from '@prisma/client'
import { prisma } from './prisma'
import { normalizeHtml, calculateHash, calculateChangePercent } from './html-utils'
import { handleIncidents } from './incident-handler'

export interface CheckResult {
  websiteId: string
  url: string
  status: 'up' | 'down' | 'error'
  statusCode: number
  responseTime: number
  changePercent: number | null
  hasChange: boolean
  errorMessage?: string
}

/**
 * Perform a monitoring check on a single website
 */
export async function performCheck(website: Website): Promise<CheckResult> {
  const startTime = Date.now()
  let result: CheckResult

  try {
    // 1. Fetch website with timeout
    const response = await axios.get(website.url, {
      timeout: 30000,
      validateStatus: () => true, // Don't throw on non-200
      maxRedirects: 5,
      headers: {
        'User-Agent': 'JF-Monitor/1.0 (Website Monitor Bot)',
      },
    })

    const responseTime = Date.now() - startTime
    const statusCode = response.status
    const isUp = statusCode === 200

    // 2. Extract and normalize HTML
    const htmlContent = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data)
    const normalizedHtml = normalizeHtml(htmlContent)
    const htmlHash = calculateHash(normalizedHtml)

    // 3. Compare with previous snapshot
    const lastSnapshot = await getLastSnapshot(website.id)
    let changePercent: number | null = null
    let hasChange = false

    if (lastSnapshot) {
      changePercent = calculateChangePercent(
        lastSnapshot.htmlContent,
        normalizedHtml
      )
      hasChange = changePercent > website.changeThreshold
    }

    // 4. Store check result
    const check = await createCheck({
      websiteId: website.id,
      statusCode,
      responseTime,
      isUp,
      htmlHash,
      changePercent,
      hasChange,
    })

    // 5. Store new snapshot if changed or first check
    if (!lastSnapshot || hasChange) {
      await createSnapshot({
        websiteId: website.id,
        htmlContent: normalizedHtml,
        htmlHash,
      })
    }

    result = {
      websiteId: website.id,
      url: website.url,
      status: isUp ? 'up' : 'down',
      statusCode,
      responseTime,
      changePercent,
      hasChange,
    }

    // 6. Handle incidents
    await handleIncidents(website, check)

    return result
  } catch (error: any) {
    // Network error, timeout, etc.
    const responseTime = Date.now() - startTime

    const check = await createCheck({
      websiteId: website.id,
      statusCode: 0,
      responseTime,
      isUp: false,
      htmlHash: '',
      changePercent: null,
      hasChange: false,
      errorMessage: error.message || 'Unknown error',
    })

    result = {
      websiteId: website.id,
      url: website.url,
      status: 'error',
      statusCode: 0,
      responseTime,
      changePercent: null,
      hasChange: false,
      errorMessage: error.message || 'Unknown error',
    }

    await handleIncidents(website, check)

    return result
  }
}

/**
 * Get the last HTML snapshot for a website
 */
async function getLastSnapshot(websiteId: string) {
  return await prisma.htmlSnapshot.findFirst({
    where: { websiteId },
    orderBy: { capturedAt: 'desc' },
  })
}

/**
 * Create a new check record
 */
async function createCheck(data: {
  websiteId: string
  statusCode: number
  responseTime: number
  isUp: boolean
  htmlHash: string
  changePercent: number | null
  hasChange: boolean
  errorMessage?: string
}): Promise<Check> {
  return await prisma.check.create({
    data: {
      websiteId: data.websiteId,
      statusCode: data.statusCode,
      responseTime: data.responseTime,
      isUp: data.isUp,
      htmlHash: data.htmlHash,
      changePercent: data.changePercent,
      hasChange: data.hasChange,
      errorMessage: data.errorMessage,
    },
  })
}

/**
 * Create a new HTML snapshot
 */
async function createSnapshot(data: {
  websiteId: string
  htmlContent: string
  htmlHash: string
}) {
  // Keep only the last 10 snapshots per website
  const existingSnapshots = await prisma.htmlSnapshot.findMany({
    where: { websiteId: data.websiteId },
    orderBy: { capturedAt: 'desc' },
    select: { id: true },
  })

  if (existingSnapshots.length >= 10) {
    // Delete the oldest snapshots
    const idsToDelete = existingSnapshots.slice(9).map((s) => s.id)
    await prisma.htmlSnapshot.deleteMany({
      where: { id: { in: idsToDelete } },
    })
  }

  return await prisma.htmlSnapshot.create({
    data: {
      websiteId: data.websiteId,
      htmlContent: data.htmlContent,
      htmlHash: data.htmlHash,
    },
  })
}

/**
 * Check all websites that are due for monitoring
 */
export async function checkDueWebsites(): Promise<CheckResult[]> {
  const websites = await prisma.website.findMany({
    where: { isActive: true },
  })

  const results: CheckResult[] = []

  for (const website of websites) {
    // Check if website is due for checking
    const lastCheck = await prisma.check.findFirst({
      where: { websiteId: website.id },
      orderBy: { timestamp: 'desc' },
    })

    const isDue = !lastCheck ||
      (Date.now() - lastCheck.timestamp.getTime()) >= (website.checkFrequency * 1000)

    if (isDue) {
      const result = await performCheck(website)
      results.push(result)
    }
  }

  return results
}
