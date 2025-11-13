import { Website, Incident, IncidentType, AlertConfig } from '@prisma/client'
import { prisma } from './prisma'
import * as brevo from '@getbrevo/brevo'
import TelegramBot from 'node-telegram-bot-api'

/**
 * Get alert configuration
 */
async function getAlertConfig(): Promise<AlertConfig | null> {
  return await prisma.alertConfig.findFirst()
}

/**
 * Generate email subject based on incident type
 */
function getEmailSubject(incident: Incident & { website: Website }): string {
  switch (incident.type) {
    case IncidentType.DOWNTIME:
      return `🔴 ${incident.website.name} is DOWN`
    case IncidentType.CONTENT_CHANGE:
      return `⚠️ ${incident.website.name} content changed`
    case IncidentType.TIMEOUT:
      return `⏱️ ${incident.website.name} timeout`
    case IncidentType.ERROR:
      return `⚠️ ${incident.website.name} error detected`
    default:
      return `⚠️ Issue detected: ${incident.website.name}`
  }
}

/**
 * Generate email HTML content
 */
function generateEmailHtml(incident: Incident & { website: Website }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
        }
        .header {
          background: #EF4444;
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
        }
        .header h2 {
          margin: 0;
        }
        .content {
          padding: 30px;
          background: #F9FAFB;
        }
        .detail {
          margin: 15px 0;
          padding: 10px;
          background: white;
          border-left: 4px solid #3B82F6;
        }
        .detail strong {
          color: #111827;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #3B82F6;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6B7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${getEmailSubject(incident)}</h2>
        </div>
        <div class="content">
          <div class="detail">
            <strong>Website:</strong> ${incident.website.name}
          </div>
          <div class="detail">
            <strong>URL:</strong> <a href="${incident.website.url}">${incident.website.url}</a>
          </div>
          <div class="detail">
            <strong>Time:</strong> ${incident.startTime.toISOString()}
          </div>
          ${incident.statusCode ? `
            <div class="detail">
              <strong>Status Code:</strong> ${incident.statusCode}
            </div>
          ` : ''}
          ${incident.changePercent ? `
            <div class="detail">
              <strong>Change:</strong> ${incident.changePercent}%
            </div>
          ` : ''}
          ${incident.description ? `
            <div class="detail">
              <strong>Details:</strong> ${incident.description}
            </div>
          ` : ''}
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard" class="button">
            View Dashboard
          </a>
        </div>
        <div class="footer">
          JF Monitor - Website Monitoring Service
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send email alert using Brevo
 */
async function sendEmailAlert(
  incident: Incident & { website: Website },
  config: AlertConfig
): Promise<void> {
  if (!config.emailEnabled || !config.brevoApiKey) {
    console.log('Email alerts disabled or API key not configured')
    return
  }

  try {
    const apiInstance = new brevo.TransactionalEmailsApi()
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      config.brevoApiKey
    )

    const subject = getEmailSubject(incident)
    const htmlContent = generateEmailHtml(incident)

    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.subject = subject
    sendSmtpEmail.htmlContent = htmlContent
    sendSmtpEmail.sender = {
      name: 'JF Monitor',
      email: config.emailFrom,
    }
    sendSmtpEmail.to = config.emailTo.map((email) => ({ email }))

    await apiInstance.sendTransacEmail(sendSmtpEmail)

    // Update incident to mark alert as sent
    await prisma.incident.update({
      where: { id: incident.id },
      data: {
        alertSent: true,
        alertSentAt: new Date(),
      },
    })

    console.log(`Email alert sent for incident ${incident.id}`)
  } catch (error) {
    console.error('Failed to send email alert:', error)
    throw error
  }
}

/**
 * Generate Telegram message
 */
function generateTelegramMessage(
  incident: Incident & { website: Website }
): string {
  const emoji = incident.type === IncidentType.DOWNTIME ? '🔴' : '⚠️'
  const title =
    incident.type === IncidentType.DOWNTIME
      ? 'DOWNTIME ALERT'
      : incident.type === IncidentType.CONTENT_CHANGE
      ? 'CONTENT CHANGE ALERT'
      : 'ALERT'

  return `
<b>${emoji} ${title}</b>

<b>Site:</b> ${incident.website.name}
<b>URL:</b> ${incident.website.url}
<b>Time:</b> ${incident.startTime.toLocaleString('en-US', { timeZone: 'UTC' })} UTC
${incident.statusCode ? `<b>Status:</b> ${incident.statusCode}\n` : ''}${incident.changePercent ? `<b>Change:</b> ${incident.changePercent}%\n` : ''}
${incident.description || ''}
  `.trim()
}

/**
 * Send Telegram alert
 */
async function sendTelegramAlert(
  incident: Incident & { website: Website },
  config: AlertConfig
): Promise<void> {
  if (!config.telegramEnabled || !config.telegramBotToken || !config.telegramChatId) {
    console.log('Telegram alerts disabled or not configured')
    return
  }

  try {
    const bot = new TelegramBot(config.telegramBotToken)

    const message = generateTelegramMessage(incident)
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📊 View Dashboard',
            url: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard`,
          },
        ],
      ],
    }

    await bot.sendMessage(config.telegramChatId, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    })

    console.log(`Telegram alert sent for incident ${incident.id}`)
  } catch (error) {
    console.error('Failed to send Telegram alert:', error)
    throw error
  }
}

/**
 * Send alert for a new incident
 */
export async function sendAlert(
  website: Website,
  incident: Incident
): Promise<void> {
  const config = await getAlertConfig()

  if (!config) {
    console.log('Alert configuration not found')
    return
  }

  // Check alert preferences
  const shouldAlert =
    (incident.type === IncidentType.DOWNTIME && config.alertOnDown) ||
    (incident.type === IncidentType.CONTENT_CHANGE && config.alertOnChange)

  if (!shouldAlert) {
    console.log('Alert not sent due to configuration')
    return
  }

  // Get full incident with website
  const fullIncident = await prisma.incident.findUnique({
    where: { id: incident.id },
    include: { website: true },
  })

  if (!fullIncident) {
    console.error('Incident not found')
    return
  }

  // Send alerts in parallel
  const promises: Promise<void>[] = []

  if (config.emailEnabled) {
    promises.push(sendEmailAlert(fullIncident, config))
  }

  if (config.telegramEnabled) {
    promises.push(sendTelegramAlert(fullIncident, config))
  }

  await Promise.allSettled(promises)
}

/**
 * Send recovery alert when incident is resolved
 */
export async function sendRecoveryAlert(
  website: Website,
  incident: Incident
): Promise<void> {
  const config = await getAlertConfig()

  if (!config || !config.alertOnRecovery) {
    return
  }

  const duration = incident.endTime
    ? Math.round((incident.endTime.getTime() - incident.startTime.getTime()) / 1000)
    : 0

  const recoveryMessage = `
✅ <b>RECOVERY: ${website.name} is back up</b>

<b>Site:</b> ${website.name}
<b>URL:</b> ${website.url}
<b>Downtime:</b> ${formatDuration(duration)}
<b>Resolved at:</b> ${incident.endTime?.toLocaleString('en-US', { timeZone: 'UTC' })} UTC
  `.trim()

  // Send Telegram recovery alert
  if (config.telegramEnabled && config.telegramBotToken && config.telegramChatId) {
    try {
      const bot = new TelegramBot(config.telegramBotToken)
      await bot.sendMessage(config.telegramChatId, recoveryMessage, {
        parse_mode: 'HTML',
      })
    } catch (error) {
      console.error('Failed to send Telegram recovery alert:', error)
    }
  }

  // Update incident
  await prisma.incident.update({
    where: { id: incident.id },
    data: {
      resolutionAlertSent: true,
    },
  })
}

/**
 * Format duration in human-readable format
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}
