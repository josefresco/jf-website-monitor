import { NextRequest, NextResponse } from 'next/server'
import { checkDueWebsites } from '@/lib/monitor'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

/**
 * POST /api/monitor/check
 * Trigger monitoring checks for all due websites
 */
export async function POST(request: NextRequest) {
  try {
    // Verify secret key for security
    const body = await request.json()
    const { secret, force } = body

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Perform checks
    const results = await checkDueWebsites()

    // Count incidents created (checks that resulted in down or change)
    const incidentsCreated = results.filter(
      (r) => r.status === 'down' || r.status === 'error' || r.hasChange
    ).length

    return NextResponse.json({
      success: true,
      checksPerformed: results.length,
      incidentsCreated,
      results,
    })
  } catch (error: any) {
    console.error('Monitor check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
