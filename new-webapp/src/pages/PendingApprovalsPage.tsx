import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui'
import { 
  ArrowLeft, Clock, Home, Users, Calendar, Info, 
  X, ChevronRight, Key, Plus, CheckCircle 
} from 'lucide-react'
import { cooperativeApi } from '../api/cooperativeApi'
import type { Cooperative, CooperativeMember } from '../types'

interface PendingMembership extends CooperativeMember {
  cooperative: Cooperative
}

export const PendingApprovalsPage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [pendingMemberships, setPendingMemberships] = useState<PendingMembership[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadPendingMemberships()
  }, [])

  const loadPendingMemberships = async () => {
    try {
      setIsLoading(true)
      const response = await cooperativeApi.getMyPendingMemberships()
      if (response.success) {
        setPendingMemberships(response.data)
      }
    } catch (error: any) {
      console.error('Failed to load pending memberships:', error)
      toast.error('Failed to load pending memberships. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelRequest = async (membership: PendingMembership) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel your membership request to "${membership.cooperative.name}"?`
    )
    
    if (!confirmed) return

    try {
      await cooperativeApi.cancelPendingRequest(membership.cooperativeId)
      toast.success('Membership request cancelled successfully')
      loadPendingMemberships()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel request')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getDaysSinceRequest = (dateString: string) => {
    const days = Math.floor(
      (new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
    )
    return days === 0 ? 'Today' : `${days}d ago`
  }

  if (isLoading && pendingMemberships.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Pending Approvals</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {pendingMemberships.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={48} className="text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">No Pending Requests</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You don't have any pending cooperative membership requests at the moment.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Info Banner */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <Clock size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">
                  {pendingMemberships.length} {pendingMemberships.length === 1 ? 'request' : 'requests'} pending
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Your membership {pendingMemberships.length === 1 ? 'request is' : 'requests are'} being reviewed by cooperative administrators
                </p>
              </div>
            </div>

            {/* Pending Membership Cards */}
            <div className="space-y-4 mb-8">
              {pendingMemberships.map((membership) => {
                const coop = membership.cooperative
                return (
                  <div
                    key={membership.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Card Header */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold text-yellow-800">Pending Approval</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {getDaysSinceRequest(membership.joinedAt)}
                      </span>
                    </div>

                    {/* Cooperative Info */}
                    <div className="flex gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Home size={24} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {coop.name}
                        </h3>
                        {coop.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {coop.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        <span>{coop.memberCount || 0} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Joined {formatDate(membership.joinedAt)}</span>
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3 mb-4">
                      <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-900">
                        Your request is being reviewed by cooperative administrators. 
                        You'll be notified once it's approved.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleCancelRequest(membership)}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                      >
                        <X size={18} />
                        Cancel Request
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Action Cards */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                What would you like to do?
              </h2>
              <div className="grid gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Key size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Join Another Cooperative
                    </h3>
                    <p className="text-sm text-gray-600">
                      Have another cooperative code? Join while you wait
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-md transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Plus size={24} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Create Your Own Cooperative
                    </h3>
                    <p className="text-sm text-gray-600">
                      Start your own and invite members immediately
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-green-600 transition-colors" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
