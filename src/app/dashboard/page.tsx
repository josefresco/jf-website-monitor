'use client'

import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'

interface Website {
  id: string
  name: string
  url: string
  isActive: boolean
  _count: {
    checks: number
    incidents: number
  }
}

interface Check {
  statusCode: number
  responseTime: number
  isUp: boolean
  timestamp: string
}

interface WebsiteStatus {
  website: Website
  lastCheck: Check | null
  uptime24h: number
  avgResponseTime: number
  activeIncidents: number
}

export default function DashboardPage() {
  const [statuses, setStatuses] = useState<WebsiteStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      // Fetch websites
      const websitesRes = await fetch('/api/websites?active=true')
      const websitesData = await websitesRes.json()

      // Handle error response
      if (!websitesRes.ok || !Array.isArray(websitesData)) {
        console.error('Error fetching websites:', websitesData)
        setStatuses([])
        setLastUpdated(new Date())
        setLoading(false)
        return
      }

      const websites: Website[] = websitesData

      // Fetch status for each website
      const statusPromises = websites.map(async (website) => {
        // Get last check
        const checksRes = await fetch(
          `/api/checks?websiteId=${website.id}&limit=1`
        )
        const checksData = await checksRes.json()
        const lastCheck = checksData.checks[0] || null

        // Get checks from last 24 hours for uptime calculation
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const checks24hRes = await fetch(
          `/api/checks?websiteId=${website.id}&startDate=${yesterday}`
        )
        const checks24hData = await checks24hRes.json()
        const checks24h = checks24hData.checks

        const uptime24h = checks24h.length > 0
          ? (checks24h.filter((c: Check) => c.isUp).length / checks24h.length) * 100
          : 0

        const avgResponseTime = checks24h.length > 0
          ? checks24h.reduce((sum: number, c: Check) => sum + c.responseTime, 0) /
            checks24h.length
          : 0

        // Get active incidents
        const incidentsRes = await fetch(
          `/api/incidents?websiteId=${website.id}&isResolved=false`
        )
        const incidentsData = await incidentsRes.json()
        const activeIncidents = incidentsData.incidents.length

        return {
          website,
          lastCheck,
          uptime24h,
          avgResponseTime,
          activeIncidents,
        }
      })

      const results = await Promise.all(statusPromises)
      setStatuses(results)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: WebsiteStatus) => {
    if (!status.lastCheck) return 'bg-gray-100 text-gray-800'
    if (!status.lastCheck.isUp) return 'bg-red-100 text-red-800'
    if (status.activeIncidents > 0) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusIcon = (status: WebsiteStatus) => {
    if (!status.lastCheck) return '⚪'
    if (!status.lastCheck.isUp) return '🔴'
    if (status.activeIncidents > 0) return '🟡'
    return '🟢'
  }

  const getStatusText = (status: WebsiteStatus) => {
    if (!status.lastCheck) return 'No Data'
    if (!status.lastCheck.isUp) return 'DOWN'
    if (status.activeIncidents > 0) return 'Warning'
    return 'UP'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Now
          </button>
        </div>

        {/* Status Cards */}
        {statuses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">
              No websites configured yet.
            </p>
            <a
              href="/websites"
              className="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Your First Website
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statuses.map((status) => (
              <div
                key={status.website.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      status
                    )}`}
                  >
                    {getStatusIcon(status)} {getStatusText(status)}
                  </span>
                  <a
                    href={`/websites/${status.website.id}`}
                    className="text-primary hover:text-blue-600 text-sm font-medium"
                  >
                    Details →
                  </a>
                </div>

                {/* Website Name */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">
                  {status.website.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4 truncate">
                  {status.website.url}
                </p>

                {/* Metrics */}
                <div className="space-y-2 text-sm">
                  {status.lastCheck && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Check:</span>
                      <span className="font-medium">
                        {formatTimeAgo(status.lastCheck.timestamp)}
                      </span>
                    </div>
                  )}
                  {status.lastCheck && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response Time:</span>
                      <span className="font-medium">
                        {status.lastCheck.responseTime}ms
                        {status.avgResponseTime > 0 && (
                          <span className="text-gray-500 text-xs">
                            {' '}
                            (avg: {Math.round(status.avgResponseTime)}ms)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime (24h):</span>
                    <span className="font-medium">
                      {status.uptime24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Incidents:</span>
                    <span
                      className={`font-medium ${
                        status.activeIncidents > 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {status.activeIncidents}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
