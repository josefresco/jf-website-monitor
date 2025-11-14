'use client'

import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'

interface Check {
  id: string
  websiteId: string
  statusCode: number
  responseTime: number
  isUp: boolean
  changePercent: number | null
  hasChange: boolean
  timestamp: string
  errorMessage: string | null
  website?: {
    id: string
    name: string
    url: string
  }
}

interface Website {
  id: string
  name: string
  url: string
}

export default function LogsPage() {
  const [checks, setChecks] = useState<Check[]>([])
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    websiteId: '',
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'all', // all, up, down
  })

  useEffect(() => {
    fetchWebsites()
  }, [])

  useEffect(() => {
    fetchChecks()
  }, [filters])

  const fetchWebsites = async () => {
    try {
      const res = await fetch('/api/websites')
      const data = await res.json()
      if (Array.isArray(data)) {
        setWebsites(data)
      }
    } catch (error) {
      console.error('Error fetching websites:', error)
    }
  }

  const fetchChecks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.websiteId) params.append('websiteId', filters.websiteId)
      if (filters.startDate) {
        const startDateTime = new Date(filters.startDate + 'T00:00:00Z').toISOString()
        params.append('startDate', startDateTime)
      }
      if (filters.endDate) {
        const endDateTime = new Date(filters.endDate + 'T23:59:59Z').toISOString()
        params.append('endDate', endDateTime)
      }
      params.append('limit', '100')

      const res = await fetch(`/api/checks?${params}`)
      const data = await res.json()

      if (data.checks && Array.isArray(data.checks)) {
        // Fetch website details for each check
        const checksWithWebsites = await Promise.all(
          data.checks.map(async (check: Check) => {
            const website = websites.find((w) => w.id === check.websiteId)
            return {
              ...check,
              website: website || {
                id: check.websiteId,
                name: 'Unknown',
                url: '',
              },
            }
          })
        )

        // Apply status filter
        let filteredChecks = checksWithWebsites
        if (filters.status === 'up') {
          filteredChecks = filteredChecks.filter((c) => c.isUp)
        } else if (filters.status === 'down') {
          filteredChecks = filteredChecks.filter((c) => !c.isUp)
        }

        setChecks(filteredChecks)
      }
    } catch (error) {
      console.error('Error fetching checks:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getStatusColor = (isUp: boolean) => {
    return isUp ? 'text-green-600' : 'text-red-600'
  }

  const getStatusBadge = (isUp: boolean) => {
    return isUp ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
        UP
      </span>
    ) : (
      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
        DOWN
      </span>
    )
  }

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Check History</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <select
                value={filters.websiteId}
                onChange={(e) => setFilters({ ...filters, websiteId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Websites</option>
                {websites.map((website) => (
                  <option key={website.id} value={website.id}>
                    {website.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="up">Up Only</option>
                <option value="down">Down Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-gray-500">Loading checks...</div>
          </div>
        ) : checks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No checks found for the selected filters.</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your date range or website selection.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Website
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Response Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Change
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {checks.map((check) => (
                      <tr key={check.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {check.website?.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {check.website?.url}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(check.isUp)}
                            <span className="text-sm text-gray-600">
                              {check.statusCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {check.responseTime}ms
                          </span>
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
                          {formatDate(check.timestamp)}
                        </td>
                        <td className="px-6 py-4">
                          {check.errorMessage ? (
                            <span className="text-xs text-red-600 max-w-xs truncate block">
                              {check.errorMessage}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500 text-center">
              Showing {checks.length} check{checks.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>
    </>
  )
}
