import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as brevo from '@getbrevo/brevo'

export const dynamic = 'force-dynamic'

/**
 * GET /api/alerts/test
 * Send a test email alert
 */
export async function GET() {
  try {
    // Get alert config
    const config = await prisma.alertConfig.findFirst()

    if (!config || !config.emailEnabled) {
      return NextResponse.json(
        { error: 'Email alerts are not enabled' },
        { status: 400 }
      )
    }

    if (!config.brevoApiKey) {
      return NextResponse.json(
        { error: 'Brevo API key is not configured' },
        { status: 400 }
      )
    }

    if (!config.emailTo || config.emailTo.length === 0) {
      return NextResponse.json(
        { error: 'No recipient email addresses configured' },
        { status: 400 }
      )
    }

    // Send test email using Brevo
    const apiInstance = new brevo.TransactionalEmailsApi()
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      config.brevoApiKey
    )

    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.subject = '🧪 Test Alert - Website Monitor'
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Test Alert</h2>
        <p>This is a test email from your Website Monitor.</p>
        <p><strong>If you're receiving this, your email alerts are configured correctly! ✅</strong></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Configuration:</strong><br>
          • Recipients: ${config.emailTo.join(', ')}<br>
          • Alerts enabled for: ${[
            config.alertOnDown && 'Downtime',
            config.alertOnChange && 'Content Changes',
            config.alertOnRecovery && 'Recovery'
          ].filter(Boolean).join(', ')}
        </p>
      </div>
    `
    sendSmtpEmail.sender = {
      name: 'JF Monitor',
      email: config.emailFrom,
    }
    sendSmtpEmail.to = config.emailTo.map((email) => ({ email }))

    await apiInstance.sendTransacEmail(sendSmtpEmail)

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully! Check your inbox.',
      recipients: config.emailTo,
    })
  } catch (error: any) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}
