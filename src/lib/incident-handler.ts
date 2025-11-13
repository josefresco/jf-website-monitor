import { Website, Check, Incident, IncidentType } from '@prisma/client'
import { prisma } from './prisma'
import { sendAlert, sendRecoveryAlert } from './alerts'

/**
 * Get active incident for a website
 */
async function getActiveIncident(websiteId: string): Promise<Incident | null> {
  return await prisma.incident.findFirst({
    where: {
      websiteId,
      isResolved: false,
    },
    orderBy: {
      startTime: 'desc',
    },
  })
}

/**
 * Create a new incident
 */
async function createIncident(data: {
  websiteId: string
  type: IncidentType
  statusCode?: number
  changePercent?: number
  description?: string
}): Promise<Incident> {
  return await prisma.incident.create({
    data: {
      websiteId: data.websiteId,
      type: data.type,
      startTime: new Date(),
      statusCode: data.statusCode,
      changePercent: data.changePercent,
      description: data.description,
    },
  })
}

/**
 * Resolve an existing incident
 */
async function resolveIncident(incidentId: string): Promise<Incident> {
  return await prisma.incident.update({
    where: { id: incidentId },
    data: {
      isResolved: true,
      endTime: new Date(),
    },
  })
}

/**
 * Handle incidents based on check results
 */
export async function handleIncidents(
  website: Website,
  checkResult: Check
): Promise<void> {
  const activeIncident = await getActiveIncident(website.id)

  if (!checkResult.isUp) {
    // Site is down
    if (!activeIncident || activeIncident.type !== IncidentType.DOWNTIME) {
      // Close any other active incident
      if (activeIncident && activeIncident.type !== IncidentType.DOWNTIME) {
        await resolveIncident(activeIncident.id)
      }

      // Create new downtime incident
      const incident = await createIncident({
        websiteId: website.id,
        type: IncidentType.DOWNTIME,
        statusCode: checkResult.statusCode,
        description:
          checkResult.errorMessage ||
          `HTTP ${checkResult.statusCode}`,
      })

      // Send alert
      await sendAlert(website, incident)
    }
  } else if (checkResult.hasChange) {
    // Content changed significantly
    if (!activeIncident || activeIncident.type !== IncidentType.CONTENT_CHANGE) {
      // Close any other active incident
      if (activeIncident && activeIncident.type !== IncidentType.CONTENT_CHANGE) {
        await resolveIncident(activeIncident.id)
      }

      const incident = await createIncident({
        websiteId: website.id,
        type: IncidentType.CONTENT_CHANGE,
        changePercent: checkResult.changePercent || 0,
        description: `Content changed by ${checkResult.changePercent}%`,
      })

      await sendAlert(website, incident)
    }
  } else {
    // Site is up and normal
    if (activeIncident) {
      // Resolve incident
      const resolvedIncident = await resolveIncident(activeIncident.id)

      // Send recovery alert
      await sendRecoveryAlert(website, resolvedIncident)
    }
  }
}
