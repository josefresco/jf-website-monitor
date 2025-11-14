import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { diffLines } from 'diff'

export const dynamic = 'force-dynamic'

/**
 * GET /api/snapshots/compare?oldId=xxx&newId=yyy
 * Compare two HTML snapshots
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const oldId = searchParams.get('oldId')
    const newId = searchParams.get('newId')

    if (!oldId || !newId) {
      return NextResponse.json(
        { error: 'Both oldId and newId are required' },
        { status: 400 }
      )
    }

    // Get both snapshots
    const [oldSnapshot, newSnapshot] = await Promise.all([
      prisma.htmlSnapshot.findUnique({ where: { id: oldId } }),
      prisma.htmlSnapshot.findUnique({ where: { id: newId } }),
    ])

    if (!oldSnapshot || !newSnapshot) {
      return NextResponse.json(
        { error: 'One or both snapshots not found' },
        { status: 404 }
      )
    }

    // Calculate diff
    const diff = diffLines(oldSnapshot.htmlContent, newSnapshot.htmlContent)

    // Calculate statistics
    let addedLines = 0
    let removedLines = 0
    let unchangedLines = 0

    diff.forEach((part) => {
      const count = part.count || 0
      if (part.added) {
        addedLines += count
      } else if (part.removed) {
        removedLines += count
      } else {
        unchangedLines += count
      }
    })

    const totalLines = Math.max(
      oldSnapshot.htmlContent.split('\n').length,
      newSnapshot.htmlContent.split('\n').length
    )
    const changePercent = ((addedLines + removedLines) / totalLines) * 100

    return NextResponse.json({
      oldSnapshot: {
        id: oldSnapshot.id,
        capturedAt: oldSnapshot.capturedAt,
        htmlHash: oldSnapshot.htmlHash,
      },
      newSnapshot: {
        id: newSnapshot.id,
        capturedAt: newSnapshot.capturedAt,
        htmlHash: newSnapshot.htmlHash,
      },
      diff,
      stats: {
        totalLines,
        addedLines,
        removedLines,
        unchangedLines,
        changePercent: Math.round(changePercent * 100) / 100,
      },
    })
  } catch (error: any) {
    console.error('Error comparing snapshots:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to compare snapshots' },
      { status: 500 }
    )
  }
}
