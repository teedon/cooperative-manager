import React, { useEffect, useState } from 'react'
import { Download, TrendingUp, Smartphone, Globe } from 'lucide-react'
import { downloadsApi } from '../api/downloadsApi'
import type { DownloadStats } from '../api/downloadsApi'

export const DownloadStatsPage: React.FC = () => {
  const [stats, setStats] = useState<DownloadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await downloadsApi.getStats()
      setStats(data)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load download statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">Error</h3>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadStats}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const platformIcons = {
    android: <Smartphone className="w-6 h-6 text-green-600" />,
    ios: <Smartphone className="w-6 h-6 text-gray-800" />,
    web: <Globe className="w-6 h-6 text-blue-600" />,
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Download className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Download Statistics</h1>
          </div>
          <p className="text-gray-600">Track app downloads across all platforms</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Downloads */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Downloads</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
          </div>

          {/* Android Downloads */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Android</h3>
              {platformIcons.android}
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {(stats.byPlatform.android || 0).toLocaleString()}
            </p>
          </div>

          {/* iOS Downloads */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">iOS</h3>
              {platformIcons.ios}
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {(stats.byPlatform.ios || 0).toLocaleString()}
            </p>
          </div>

          {/* Web Downloads */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-400">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Web</h3>
              {platformIcons.web}
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {(stats.byPlatform.web || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Last 30 Days</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-gray-600 text-sm mb-1">Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.last30Days.toLocaleString()}</p>
            </div>
            <div className="flex-1">
              <p className="text-gray-600 text-sm mb-1">Average per Day</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(stats.last30Days / 30).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Daily Breakdown */}
        {stats.dailyDownloads.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Last 7 Days</h3>
            <div className="space-y-3">
              {stats.dailyDownloads.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600">{day.date}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 w-64">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((day.count / Math.max(...stats.dailyDownloads.map((d) => d.count))) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 w-16 text-right">
                    {day.count.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Platform Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Platform Distribution</h3>
          <div className="space-y-4">
            {Object.entries(stats.byPlatform).map(([platform, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {platformIcons[platform as keyof typeof platformIcons]}
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {platform}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        platform === 'android'
                          ? 'bg-green-600'
                          : platform === 'ios'
                            ? 'bg-gray-800'
                            : 'bg-blue-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={loadStats}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            Refresh Statistics
          </button>
        </div>
      </div>
    </div>
  )
}
