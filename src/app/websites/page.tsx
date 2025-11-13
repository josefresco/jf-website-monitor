'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'

interface Website {
  id: string
  name: string
  url: string
  checkFrequency: number
  changeThreshold: number
  isActive: boolean
  createdAt: string
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    checkFrequency: 300,
    changeThreshold: 10,
  })

  const fetchWebsites = async () => {
    try {
      const res = await fetch('/api/websites')
      const data = await res.json()
      setWebsites(data)
    } catch (error) {
      console.error('Error fetching websites:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWebsites()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({ name: '', url: '', checkFrequency: 300, changeThreshold: 10 })
        fetchWebsites()
        alert('Website added successfully!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding website:', error)
      alert('Failed to add website')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this website?')) return

    try {
      const res = await fetch(`/api/websites/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchWebsites()
        alert('Website removed')
      }
    } catch (error) {
      console.error('Error deleting website:', error)
      alert('Failed to remove website')
    }
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Websites</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Website'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Website</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="My Website"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check Frequency
                </label>
                <select
                  value={formData.checkFrequency}
                  onChange={(e) =>
                    setFormData({ ...formData, checkFrequency: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value={300}>Every 5 minutes</option>
                  <option value={900}>Every 15 minutes</option>
                  <option value={1800}>Every 30 minutes</option>
                  <option value={3600}>Every hour</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Change Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.changeThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, changeThreshold: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when HTML changes exceed this percentage
                </p>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Website
              </button>
            </form>
          </div>
        )}

        {websites.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">No websites configured yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Your First Website
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {websites.map((website) => (
              <div
                key={website.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {website.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{website.url}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Check Frequency:</span>
                        <span className="ml-2 font-medium">
                          {website.checkFrequency / 60} minutes
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Change Threshold:</span>
                        <span className="ml-2 font-medium">{website.changeThreshold}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`ml-2 font-medium ${
                            website.isActive ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {website.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Added:</span>
                        <span className="ml-2 font-medium">
                          {new Date(website.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(website.id)}
                    className="ml-4 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
