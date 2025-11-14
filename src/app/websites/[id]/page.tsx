'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

interface Website {
  id: string
  name: string
  url: string
  checkFrequency: number
  changeThreshold: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Check {
  id: string
  statusCode: number
  responseTime: number
  isUp: boolean
  changePercent: number | null
  hasChange: boolean
  timestamp: string
  errorMessage: string | null
}

interface Incident {
  id: string
  type: string
  startTime: string
  endTime: string | null
  isResolved: boolean
  statusCode: number | null
  changePercent: number | null
  description: string | null
}

export default function WebsiteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [website, setWebsite] = useState<Website | null>(null)
  const [recentChecks, setRecentChecks] = useState<Check[]>([])
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState({
    uptime24h: 0,
    avgResponseTime: 0,
    totalChecks: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchWebsiteDetails()
    }
  }, [params.id])

  const fetchWebsiteDetails = async () => {
    try {
      // Fetch website info
      const websiteRes = await fetch(`/api/websites/${params.id}`)
      if (!websiteRes.ok) {
        router.push('/websites')
        return
      }
      const websiteData = await websiteRes.json()
      setWebsite(websiteData)

      // Fetch recent checks (last 10)
      const checksRes = await fetch(`/api/checks?websiteId=${params.id}&limit=10`)
      const checksData = await checksRes.json()
      setRecentChecks(checksData.checks || [])

      // Fetch checks from last 24 hours for stats
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const checks24hRes = await fetch(
        `/api/checks?websiteId=${params.id}&startDate=${yesterday}`
      )
      const checks24hData = await checks24hRes.json()
      const checks24h = checks24hData.checks || []

      // Calculate stats
      const uptime =
        checks24h.length > 0
          ? (checks24h.filter((c: Check) => c.isUp).length / checks24h.length) * 100
          : 0
      const avgTime =
        checks24h.length > 0
          ? checks24h.reduce((sum: number, c: Check) => sum + c.responseTime, 0) /
            checks24h.length
          : 0

      setStats({
        uptime24h: uptime,
        avgResponseTime: avgTime,
        totalChecks: checks24h.length,
      })

      // Fetch active incidents
      const incidentsRes = await fetch(
        `/api/incidents?websiteId=${params.id}&isResolved=false`
      )
      const incidentsData = await incidentsRes.json()
      setActiveIncidents(incidentsData.incidents || [])
    } catch (error) {
      console.error('Error fetching website details:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const getIncidentTypeColor = (type: string) => {
    switch (type) {
      case 'DOWNTIME':
        return 'bg-red-100 text-red-800'
      case 'CONTENT_CHANGE':
        return 'bg-yellow-100 text-yellow-800'
      case 'TIMEOUT':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">Loading website details...</div>
        </div>
      </>
    )
  }

  if (!website) {
    return (
      <>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-600">Website not found</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{website.name}</h1>
              <a
                href={website.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {website.url}
              </a>
            </div>
            <button
              onClick={() => router.push('/websites')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Back to Websites
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span
              className={`px-3 py-1 rounded-full ${
                website.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {website.isActive ? 'Active' : 'Inactive'}
            </span>
            <span>Added: {formatDate(website.createdAt)}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Uptime (24h)
            </h3>
            <p
              className={`text-4xl font-bold ${
                stats.uptime24h >= 99.9
                  ? 'text-green-600'
                  : stats.uptime24h >= 95
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {stats.uptime24h.toFixed(2)}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Avg Response Time
            </h3>
            <p className="text-4xl font-bold text-primary">
              {Math.round(stats.avgResponseTime)}
              <span className="text-xl">ms</span>
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Checks (24h)
            </h3>
            <p className="text-4xl font-bold text-gray-900">{stats.totalChecks}</p>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Check Frequency:</span>
              <span className="ml-2 font-medium">
                Every {website.checkFrequency / 60} minutes
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Change Threshold:</span>
              <span className="ml-2 font-medium">{website.changeThreshold}%</span>
            </div>
          </div>
        </div>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Active Incidents
            </h2>
            <div className="space-y-4">
              {activeIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="border border-red-200 bg-red-50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getIncidentTypeColor(
                        incident.type
                      )}`}
                    >
                      {incident.type.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-600">
                      Started: {formatTimeAgo(incident.startTime)}
                    </span>
                  </div>
                  {incident.description && (
                    <p className="text-sm text-gray-700">{incident.description}</p>
                  )}
                  {incident.statusCode && (
                    <p className="text-xs text-gray-500 mt-1">
                      Status Code: {incident.statusCode}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Checks */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Checks</h2>
          {recentChecks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No checks recorded yet. The first check will appear here soon.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Response Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentChecks.map((check) => (
                    <tr key={check.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            check.isUp
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {check.statusCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {check.responseTime}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {check.hasChange ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            {check.changePercent?.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimeAgo(check.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600">
                        {check.errorMessage || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
