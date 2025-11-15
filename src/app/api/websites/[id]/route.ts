import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateWebsiteSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  checkFrequency: z.number().min(300).max(3600).optional(),
  changeThreshold: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
})

/**
 * GET /api/websites/[id]
 * Get a single website by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const website = await prisma.website.findUnique({
      where: { id: params.id },
      include: {
        checks: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
        incidents: {
          take: 5,
          orderBy: { startTime: 'desc' },
        },
      },
    })

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(website)
  } catch (error: any) {
    console.error('Error fetching website:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/websites/[id]
 * Update a website
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateWebsiteSchema.parse(body)

    const website = await prisma.website.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json(website)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    console.error('Error updating website:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/websites/[id]
 * Soft delete a website (set isActive = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const website = await prisma.website.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Website deactivated',
      website,
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    console.error('Error deleting website:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
