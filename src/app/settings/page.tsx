'use client'

import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'

interface AlertConfig {
  id: string
  emailEnabled: boolean
  emailTo: string[]
  emailFrom: string
  brevoApiKey: string
  telegramEnabled: boolean
  telegramBotToken: string
  telegramChatId: string
  alertOnDown: boolean
  alertOnChange: boolean
  alertOnRecovery: boolean
}

export default function SettingsPage() {
  const [config, setConfig] = useState<AlertConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [emailInput, setEmailInput] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/alerts/config')
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      } else {
        // No config exists yet, create default
        setConfig({
          id: '',
          emailEnabled: false,
          emailTo: [],
          emailFrom: 'monitor@example.com',
          brevoApiKey: '',
          telegramEnabled: false,
          telegramBotToken: '',
          telegramChatId: '',
          alertOnDown: true,
          alertOnChange: true,
          alertOnRecovery: true,
        })
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/alerts/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (res.ok) {
        const updated = await res.json()
        setConfig(updated)
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Error saving config:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const addEmail = () => {
    if (!config || !emailInput.trim()) return
    if (!emailInput.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }
    if (config.emailTo.includes(emailInput)) {
      setMessage({ type: 'error', text: 'Email already added' })
      return
    }

    setConfig({
      ...config,
      emailTo: [...config.emailTo, emailInput.trim()],
    })
    setEmailInput('')
    setMessage(null)
  }

  const removeEmail = (email: string) => {
    if (!config) return
    setConfig({
      ...config,
      emailTo: config.emailTo.filter((e) => e !== email),
    })
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">Loading settings...</div>
        </div>
      </>
    )
  }

  if (!config) {
    return (
      <>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-600">Failed to load settings</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Alert Settings</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-8">
          {/* Email Alerts Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Email Alerts</h2>
              <label className="flex items-center cursor-pointer">
                <span className="mr-3 text-sm font-medium text-gray-700">Enabled</span>
                <input
                  type="checkbox"
                  checked={config.emailEnabled}
                  onChange={(e) =>
                    setConfig({ ...config, emailEnabled: e.target.checked })
                  }
                  className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                />
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Email Address
                </label>
                <input
                  type="email"
                  value={config.emailFrom}
                  onChange={(e) => setConfig({ ...config, emailFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="monitor@example.com"
                  disabled={!config.emailEnabled}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This address will appear as the sender of alert emails
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email Addresses
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="email@example.com"
                    disabled={!config.emailEnabled}
                  />
                  <button
                    onClick={addEmail}
                    disabled={!config.emailEnabled}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.emailTo.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {email}
                      <button
                        onClick={() => removeEmail(email)}
                        className="ml-2 text-red-600 hover:text-red-800"
                        disabled={!config.emailEnabled}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brevo API Key
                </label>
                <input
                  type="password"
                  value={config.brevoApiKey}
                  onChange={(e) => setConfig({ ...config, brevoApiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="xkeysib-********************************"
                  disabled={!config.emailEnabled}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from{' '}
                  <a
                    href="https://app.brevo.com/settings/keys/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Brevo Settings
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Telegram Alerts Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Telegram Alerts</h2>
              <label className="flex items-center cursor-pointer">
                <span className="mr-3 text-sm font-medium text-gray-700">Enabled</span>
                <input
                  type="checkbox"
                  checked={config.telegramEnabled}
                  onChange={(e) =>
                    setConfig({ ...config, telegramEnabled: e.target.checked })
                  }
                  className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                />
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bot Token
                </label>
                <input
                  type="password"
                  value={config.telegramBotToken}
                  onChange={(e) =>
                    setConfig({ ...config, telegramBotToken: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  disabled={!config.telegramEnabled}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Create a bot via{' '}
                  <a
                    href="https://t.me/botfather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @BotFather
                  </a>{' '}
                  on Telegram
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chat ID
                </label>
                <input
                  type="text"
                  value={config.telegramChatId}
                  onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="123456789"
                  disabled={!config.telegramEnabled}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your Telegram chat ID (send a message to your bot, then use getUpdates API)
                </p>
              </div>
            </div>
          </div>

          {/* Alert Preferences Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Alert Preferences
            </h2>

            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.alertOnDown}
                  onChange={(e) => setConfig({ ...config, alertOnDown: e.target.checked })}
                  className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    Alert on Downtime
                  </span>
                  <span className="block text-xs text-gray-500">
                    Notify when a website becomes unavailable
                  </span>
                </span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.alertOnChange}
                  onChange={(e) =>
                    setConfig({ ...config, alertOnChange: e.target.checked })
                  }
                  className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    Alert on Content Changes
                  </span>
                  <span className="block text-xs text-gray-500">
                    Notify when website content changes exceed threshold
                  </span>
                </span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.alertOnRecovery}
                  onChange={(e) =>
                    setConfig({ ...config, alertOnRecovery: e.target.checked })
                  }
                  className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    Alert on Recovery
                  </span>
                  <span className="block text-xs text-gray-500">
                    Notify when a website recovers from an incident
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 font-medium"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
