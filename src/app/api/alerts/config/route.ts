import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const alertConfigSchema = z.object({
  emailEnabled: z.boolean().optional(),
  emailTo: z.array(z.string().email()).optional(),
  emailFrom: z.string().email().optional(),
  brevoApiKey: z.string().optional(),
  telegramEnabled: z.boolean().optional(),
  telegramBotToken: z.string().optional(),
  telegramChatId: z.string().optional(),
  alertOnDown: z.boolean().optional(),
  alertOnChange: z.boolean().optional(),
  alertOnRecovery: z.boolean().optional(),
})

/**
 * GET /api/alerts/config
 * Get current alert configuration
 */
export async function GET() {
  try {
    let config = await prisma.alertConfig.findFirst()

    // Create default config if none exists
    if (!config) {
      config = await prisma.alertConfig.create({
        data: {
          emailEnabled: false,
          emailTo: [],
          emailFrom: '',
          telegramEnabled: false,
          alertOnDown: true,
          alertOnChange: true,
          alertOnRecovery: true,
        },
      })
    }

    // Remove sensitive data from response
    const safeConfig = {
      ...config,
      brevoApiKey: config.brevoApiKey ? '***' : null,
      telegramBotToken: config.telegramBotToken ? '***' : null,
    }

    return NextResponse.json(safeConfig)
  } catch (error: any) {
    console.error('Error fetching alert config:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/alerts/config
 * Update alert configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = alertConfigSchema.parse(body)

    // Get existing config
    let config = await prisma.alertConfig.findFirst()

    if (!config) {
      // Create new config
      config = await prisma.alertConfig.create({
        data: validatedData as any,
      })
    } else {
      // Update existing config
      config = await prisma.alertConfig.update({
        where: { id: config.id },
        data: validatedData,
      })
    }

    // Remove sensitive data from response
    const safeConfig = {
      ...config,
      brevoApiKey: config.brevoApiKey ? '***' : null,
      telegramBotToken: config.telegramBotToken ? '***' : null,
    }

    return NextResponse.json(safeConfig)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating alert config:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
