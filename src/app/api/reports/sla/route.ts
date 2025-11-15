import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reports/sla
 * Get SLA metrics for websites
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const websiteId = searchParams.get('websiteId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    // Get websites to report on
    const websites = await prisma.website.findMany({
      where: websiteId && websiteId !== 'all' ? { id: websiteId } : { isActive: true },
    })

    const results = await Promise.all(
      websites.map(async (website) => {
        // Get all checks in the period
        const checks = await prisma.check.findMany({
          where: {
            websiteId: website.id,
            timestamp: {
              gte: start,
              lte: end,
            },
          },
          orderBy: { timestamp: 'asc' },
        })

        const totalChecks = checks.length
        const successfulChecks = checks.filter((c) => c.isUp).length
        const failedChecks = totalChecks - successfulChecks

        // Calculate uptime percentage
        const uptimePercent = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0

        // Calculate response time metrics
        const responseTimes = checks.map((c) => c.responseTime)
        const avgResponseTime = responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0

        // Calculate 95th percentile
        const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b)
        const p95Index = Math.floor(sortedResponseTimes.length * 0.95)
        const p95ResponseTime = sortedResponseTimes[p95Index] || 0

        // Get incidents in the period
        const incidents = await prisma.incident.findMany({
          where: {
            websiteId: website.id,
            startTime: {
              gte: start,
              lte: end,
            },
          },
        })

        const totalIncidents = incidents.length

        // Calculate total downtime (in seconds)
        const totalDowntime = incidents.reduce((sum, incident) => {
          const endTime = incident.endTime || new Date()
          const duration = (endTime.getTime() - incident.startTime.getTime()) / 1000
          return sum + duration
        }, 0)

        // Calculate MTTR (Mean Time To Recovery)
        const resolvedIncidents = incidents.filter((i) => i.isResolved)
        const mttr = resolvedIncidents.length > 0
          ? resolvedIncidents.reduce((sum, incident) => {
              const duration = incident.endTime
                ? (incident.endTime.getTime() - incident.startTime.getTime()) / 1000
                : 0
              return sum + duration
            }, 0) / resolvedIncidents.length
          : 0

        // Find longest incident
        let longestIncident = 0
        incidents.forEach((incident) => {
          const endTime = incident.endTime || new Date()
          const duration = (endTime.getTime() - incident.startTime.getTime()) / 1000
          if (duration > longestIncident) {
            longestIncident = duration
          }
        })

        return {
          websiteId: website.id,
          name: website.name,
          url: website.url,
          metrics: {
            uptimePercent: Math.round(uptimePercent * 100) / 100,
            totalChecks,
            failedChecks,
            avgResponseTime: Math.round(avgResponseTime),
            p95ResponseTime: Math.round(p95ResponseTime),
            totalIncidents,
            totalDowntime: Math.round(totalDowntime),
            mttr: Math.round(mttr),
            longestIncident: Math.round(longestIncident),
          },
        }
      })
    )

    return NextResponse.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      websites: results,
    })
  } catch (error: any) {
    console.error('Error generating SLA report:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
