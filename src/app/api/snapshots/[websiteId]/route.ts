import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/snapshots/[websiteId]
 * Get HTML snapshots for a website
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { websiteId: string } }
) {
  try {
    const { websiteId } = params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get recent snapshots
    const snapshots = await prisma.htmlSnapshot.findMany({
      where: { websiteId },
      orderBy: { capturedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        htmlHash: true,
        capturedAt: true,
        htmlContent: true,
      },
    })

    return NextResponse.json(snapshots)
  } catch (error: any) {
    console.error('Error fetching snapshots:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch snapshots' },
      { status: 500 }
    )
  }
}
