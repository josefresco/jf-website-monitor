'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'

interface Website {
  id: string
  name: string
  url: string
}

interface Snapshot {
  id: string
  htmlHash: string
  capturedAt: string
  htmlContent: string
}

interface DiffPart {
  value: string
  added?: boolean
  removed?: boolean
  count?: number
}

interface CompareResult {
  oldSnapshot: { id: string; capturedAt: string; htmlHash: string }
  newSnapshot: { id: string; capturedAt: string; htmlHash: string }
  diff: DiffPart[]
  stats: {
    totalLines: number
    addedLines: number
    removedLines: number
    unchangedLines: number
    changePercent: number
  }
}

export default function SnapshotsPage() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState<string>('')
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [selectedOld, setSelectedOld] = useState<string>('')
  const [selectedNew, setSelectedNew] = useState<string>('')
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showOnlyChanges, setShowOnlyChanges] = useState(false)

  useEffect(() => {
    fetchWebsites()
  }, [])

  useEffect(() => {
    if (selectedWebsite) {
      fetchSnapshots(selectedWebsite)
    }
  }, [selectedWebsite])

  const fetchWebsites = async () => {
    try {
      const res = await fetch('/api/websites?active=true')
      const data = await res.json()
      if (Array.isArray(data)) {
        setWebsites(data)
        if (data.length > 0) {
          setSelectedWebsite(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching websites:', error)
    }
  }

  const fetchSnapshots = async (websiteId: string) => {
    try {
      const res = await fetch(`/api/snapshots/${websiteId}?limit=20`)
      const data = await res.json()
      setSnapshots(Array.isArray(data) ? data : [])
      setSelectedOld('')
      setSelectedNew('')
      setCompareResult(null)
    } catch (error) {
      console.error('Error fetching snapshots:', error)
      setSnapshots([])
    }
  }

  const handleCompare = async () => {
    if (!selectedOld || !selectedNew) return

    setLoading(true)
    try {
      const res = await fetch(
        `/api/snapshots/compare?oldId=${selectedOld}&newId=${selectedNew}`
      )
      const data = await res.json()
      setCompareResult(data)
    } catch (error) {
      console.error('Error comparing snapshots:', error)
      alert('Failed to compare snapshots')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">HTML Snapshots</h1>

        {/* Website Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Website
          </label>
          <select
            value={selectedWebsite}
            onChange={(e) => setSelectedWebsite(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {websites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} - {site.url}
              </option>
            ))}
          </select>
        </div>

        {/* Snapshot Comparison */}
        {snapshots.length >= 2 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Compare Snapshots</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Old Version
                </label>
                <select
                  value={selectedOld}
                  onChange={(e) => setSelectedOld(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select snapshot...</option>
                  {snapshots.map((snapshot) => (
                    <option key={snapshot.id} value={snapshot.id}>
                      {new Date(snapshot.capturedAt).toLocaleString()} -{' '}
                      {snapshot.htmlHash.substring(0, 8)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Version
                </label>
                <select
                  value={selectedNew}
                  onChange={(e) => setSelectedNew(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select snapshot...</option>
                  {snapshots.map((snapshot) => (
                    <option key={snapshot.id} value={snapshot.id}>
                      {new Date(snapshot.capturedAt).toLocaleString()} -{' '}
                      {snapshot.htmlHash.substring(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCompare}
              disabled={!selectedOld || !selectedNew || loading}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300"
            >
              {loading ? 'Comparing...' : 'Compare Snapshots'}
            </button>
          </div>
        )}

        {/* Comparison Results */}
        {compareResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Comparison Results</h2>

            {/* Snapshot Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg text-sm">
              <div>
                <div className="font-semibold text-gray-700 mb-1">Old Snapshot</div>
                <div className="text-xs text-gray-600">
                  {new Date(compareResult.oldSnapshot.capturedAt).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Hash: {compareResult.oldSnapshot.htmlHash.substring(0, 16)}...
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 mb-1">New Snapshot</div>
                <div className="text-xs text-gray-600">
                  {new Date(compareResult.newSnapshot.capturedAt).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Hash: {compareResult.newSnapshot.htmlHash.substring(0, 16)}...
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {compareResult.stats.changePercent}%
                </div>
                <div className="text-sm text-gray-600">Total Change</div>
                <div className="text-xs text-gray-400 mt-1">
                  ({compareResult.stats.addedLines + compareResult.stats.removedLines} / {compareResult.stats.totalLines})
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  +{compareResult.stats.addedLines}
                </div>
                <div className="text-sm text-gray-600">Added</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  -{compareResult.stats.removedLines}
                </div>
                <div className="text-sm text-gray-600">Removed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {compareResult.stats.unchangedLines}
                </div>
                <div className="text-sm text-gray-600">Unchanged</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {compareResult.stats.totalLines}
                </div>
                <div className="text-sm text-gray-600">Total Lines</div>
              </div>
            </div>

            {/* Diff Display */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
                <h3 className="font-semibold text-sm text-gray-700">HTML Diff</h3>
                <label className="flex items-center text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={showOnlyChanges}
                    onChange={(e) => setShowOnlyChanges(e.target.checked)}
                    className="mr-2"
                  />
                  Show only changes
                </label>
              </div>
              <div className="overflow-x-auto bg-gray-50">
                <pre className="text-sm font-mono p-4 leading-relaxed">
                  {compareResult.diff
                    .filter((part) => !showOnlyChanges || part.added || part.removed)
                    .map((part, index) => {
                      const lines = part.value.split('\n')
                      return lines.map((line, lineIndex) => {
                        if (lineIndex === lines.length - 1 && line === '') return null
                        const prefix = part.added ? '+ ' : part.removed ? '- ' : '  '
                        return (
                          <div
                            key={`${index}-${lineIndex}`}
                            className={
                              part.added
                                ? 'bg-green-50 text-green-900 border-l-4 border-green-500 px-2 py-1'
                                : part.removed
                                ? 'bg-red-50 text-red-900 border-l-4 border-red-500 px-2 py-1'
                                : 'text-gray-600 px-2 py-1 hover:bg-gray-100'
                            }
                          >
                            <span className="text-gray-400 select-none mr-2">
                              {prefix}
                            </span>
                            {line || ' '}
                          </div>
                        )
                      })
                    })}
                </pre>
              </div>
            </div>

            {/* Explanation */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Change percentage can exceed 100% when most
                content is replaced. For example, if 100 lines are removed and 100 new
                lines are added, that&apos;s 200 changed lines / 100 total = 200% change.
              </p>
            </div>
          </div>
        )}

        {/* Snapshot List */}
        {snapshots.length === 0 && selectedWebsite && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No snapshots available yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Snapshots are created when content changes are detected.
            </p>
          </div>
        )}

        {snapshots.length === 1 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Only one snapshot available.</p>
            <p className="text-sm text-gray-400 mt-2">
              Need at least 2 snapshots to compare changes.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
