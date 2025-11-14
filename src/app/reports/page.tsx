'use client'

import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'

interface Website {
  id: string
  name: string
  url: string
}

interface SLAReport {
  websiteId: string
  period: {
    start: string
    end: string
  }
  uptime: {
    percentage: number
    totalMinutes: number
    downMinutes: number
  }
  performance: {
    avgResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    minResponseTime: number
    maxResponseTime: number
  }
  incidents: {
    total: number
    downtime: number
    contentChange: number
    timeout: number
    error: number
    avgResolutionTime: number
    mttr: number
  }
  checks: {
    total: number
    successful: number
    failed: number
  }
}

export default function ReportsPage() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState('')
  const [report, setReport] = useState<SLAReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState(30) // days

  useEffect(() => {
    fetchWebsites()
  }, [])

  useEffect(() => {
    if (selectedWebsite) {
      fetchReport()
    }
  }, [selectedWebsite, dateRange])

  const fetchWebsites = async () => {
    try {
      const res = await fetch('/api/websites?active=true')
      const data = await res.json()
      if (Array.isArray(data)) {
        setWebsites(data)
        if (data.length > 0 && !selectedWebsite) {
          setSelectedWebsite(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching websites:', error)
    }
  }

  const fetchReport = async () => {
    if (!selectedWebsite) return

    setLoading(true)
    try {
      const endDate = new Date().toISOString()
      const startDate = new Date(
        Date.now() - dateRange * 24 * 60 * 60 * 1000
      ).toISOString()

      const res = await fetch(
        `/api/reports/sla?websiteId=${selectedWebsite}&startDate=${startDate}&endDate=${endDate}`
      )
      const data = await res.json()

      if (res.ok) {
        setReport(data)
      } else {
        console.error('Error fetching report:', data)
        setReport(null)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${(seconds / 3600).toFixed(1)}h`
  }

  const selectedWebsiteData = websites.find((w) => w.id === selectedWebsite)

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">SLA Reports</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <select
                value={selectedWebsite}
                onChange={(e) => setSelectedWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {websites.length === 0 ? (
                  <option value="">No websites available</option>
                ) : (
                  websites.map((website) => (
                    <option key={website.id} value={website.id}>
                      {website.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Report */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-gray-500">Loading report...</div>
          </div>
        ) : !selectedWebsite ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No websites configured yet.</p>
            <a
              href="/websites"
              className="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Your First Website
            </a>
          </div>
        ) : !report ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">
              No data available for the selected period.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Try selecting a different time range or website.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedWebsiteData?.name}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {selectedWebsiteData?.url}
              </p>
              <p className="text-sm text-gray-600">
                Report Period: {formatDate(report.period.start)} -{' '}
                {formatDate(report.period.end)}
              </p>
            </div>

            {/* Uptime Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Uptime Percentage
                </h3>
                <p
                  className={`text-4xl font-bold ${
                    report.uptime.percentage >= 99.9
                      ? 'text-green-600'
                      : report.uptime.percentage >= 95
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {report.uptime.percentage.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {report.uptime.downMinutes.toFixed(1)} minutes downtime
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Avg Response Time
                </h3>
                <p className="text-4xl font-bold text-primary">
                  {Math.round(report.performance.avgResponseTime)}
                  <span className="text-xl">ms</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Min: {report.performance.minResponseTime}ms | Max:{' '}
                  {report.performance.maxResponseTime}ms
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Total Incidents
                </h3>
                <p className="text-4xl font-bold text-gray-900">
                  {report.incidents.total}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  MTTR: {formatDuration(report.incidents.mttr)}
                </p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Response Time Distribution
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average:</span>
                      <span className="font-medium">
                        {Math.round(report.performance.avgResponseTime)}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        95th Percentile:
                      </span>
                      <span className="font-medium">
                        {Math.round(report.performance.p95ResponseTime)}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        99th Percentile:
                      </span>
                      <span className="font-medium">
                        {Math.round(report.performance.p99ResponseTime)}ms
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Check Statistics
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Checks:</span>
                      <span className="font-medium">{report.checks.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Successful:</span>
                      <span className="font-medium text-green-600">
                        {report.checks.successful}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Failed:</span>
                      <span className="font-medium text-red-600">
                        {report.checks.failed}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Incidents Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Incidents Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {report.incidents.downtime}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Downtime</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {report.incidents.contentChange}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Content Changes</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {report.incidents.timeout}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Timeouts</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">
                    {report.incidents.error}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Errors</p>
                </div>
              </div>

              {report.incidents.total > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Average Resolution Time:
                    </span>
                    <span className="font-bold text-primary">
                      {formatDuration(report.incidents.avgResolutionTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium text-gray-700">
                      Mean Time To Recovery (MTTR):
                    </span>
                    <span className="font-bold text-primary">
                      {formatDuration(report.incidents.mttr)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SLA Summary */}
            <div className="bg-gradient-to-r from-primary to-blue-600 rounded-lg shadow-md p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">SLA Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm opacity-90">Uptime Target (99.9%)</p>
                  <p className="text-2xl font-bold">
                    {report.uptime.percentage >= 99.9 ? '✓ Met' : '✗ Missed'}
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Total Monitoring Time</p>
                  <p className="text-2xl font-bold">
                    {Math.round(report.uptime.totalMinutes / 60)}h
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {report.checks.total > 0
                      ? ((report.checks.successful / report.checks.total) * 100).toFixed(
                          1
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
