import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const websiteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Invalid URL'),
  checkFrequency: z.number().min(300).max(3600).default(300),
  changeThreshold: z.number().min(0).max(100).default(10),
  isActive: z.boolean().default(true),
})

/**
 * GET /api/websites
 * List all websites
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('active') === 'true'

    const websites = await prisma.website.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            checks: true,
            incidents: true,
          },
        },
      },
    })

    return NextResponse.json(websites)
  } catch (error: any) {
    console.error('Error fetching websites:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/websites
 * Create a new website
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = websiteSchema.parse(body)

    // Check if URL already exists
    const existing = await prisma.website.findUnique({
      where: { url: validatedData.url },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Website with this URL already exists' },
        { status: 400 }
      )
    }

    const website = await prisma.website.create({
      data: validatedData,
    })

    return NextResponse.json(website, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating website:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
