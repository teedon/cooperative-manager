import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../hooks/useAuth'
import { logoutUser } from '../store/authSlice'
import { Button, Card, useToast } from '../components/ui'
import { 
  Users, TrendingUp, DollarSign, Activity, Plus, 
  LogOut, Building2, ArrowRight, Clock, CheckCircle,
  AlertCircle, Wallet, FileText, ShoppingCart, User
} from 'lucide-react'
import { cooperativeApi } from '../api/cooperativeApi'
import { activityApi } from '../api/activityApi'
import type { Cooperative, Activity as ActivityType } from '../types'
import { CreateCooperativeModal } from './CreateCooperativeModal'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const { user } = useAppSelector((state) => state.auth)
  
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const [coopsResponse, activitiesResponse] = await Promise.all([
        cooperativeApi.getAll(),
        activityApi.getRecent(10)
      ])
      
      if (coopsResponse.success) {
        setCooperatives(coopsResponse.data)
      }
      
      if (activitiesResponse.success) {
        setRecentActivities(activitiesResponse.data)
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data. Please refresh the page.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    dispatch(logoutUser())
    toast.info('You have been logged out')
    navigate('/login')
  }

  const handleJoinCooperative = async () => {
    if (!joinCode.trim()) {
      toast.warning('Please enter a cooperative code')
      return
    }
    
    try {
      setIsJoining(true)
      const response = await cooperativeApi.joinByCode(joinCode)
      if (response.success) {
        toast.success(`Successfully joined ${response.data.cooperative.name}!`)
        setShowJoinModal(false)
        setJoinCode('')
        loadDashboardData()
      }
    } catch (error: any) {
      console.error('Failed to join cooperative:', error)
      const errorMessage = error.response?.data?.message || 'Failed to join cooperative. Please check the code and try again.'
      toast.error(errorMessage)
    } finally {
      setIsJoining(false)
    }
  }

  const handleCreateSuccess = (cooperative: Cooperative) => {
    setCooperatives((prev) => [cooperative, ...prev])
    loadDashboardData() // Refresh to get updated data
  }

  // Calculate aggregate stats
  const totalMembers = cooperatives.reduce((sum, coop) => sum + coop.memberCount, 0)
  const totalContributions = cooperatives.reduce((sum, coop) => sum + (coop.totalContributions || 0), 0)
  const myContributions = cooperatives.reduce((sum, coop) => sum + (coop.userTotalContributions || 0), 0)
  const activeCooperatives = cooperatives.filter(c => c.status === 'active').length

  const stats = [
    {
      title: 'My Cooperatives',
      value: cooperatives.length.toString(),
      subtitle: `${activeCooperatives} active`,
      icon: <Building2 className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'My Contributions',
      value: `₦${myContributions.toLocaleString()}`,
      subtitle: 'Total saved',
      icon: <Wallet className="w-6 h-6" />,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Total Members',
      value: totalMembers.toString(),
      subtitle: 'Across all coops',
      icon: <Users className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'All Contributions',
      value: totalContributions > 999999 
        ? `₦${(totalContributions / 1000000).toFixed(1)}M`
        : `₦${(totalContributions / 1000).toFixed(0)}K`,
      subtitle: 'Total pooled',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-orange-500 to-orange-600'
    }
  ]

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const getRoleIcon = (role?: string) => {
    if (role === 'admin') return '👑'
    if (role === 'moderator') return '🛡️'
    return '👤'
  }

  const getRoleBadgeColor = (role?: string) => {
    if (role === 'admin') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (role === 'moderator') return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your cooperatives today
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-600 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {stat.icon}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Cooperatives */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">My Cooperatives</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowJoinModal(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Join
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowCreateModal(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Create
                  </Button>
                </div>
              </div>

              {cooperatives.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No cooperatives yet</h4>
                  <p className="text-gray-600 mb-6">Create your first cooperative or join an existing one</p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowJoinModal(true)}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Join Cooperative
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => setShowCreateModal(true)}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Create Cooperative
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {cooperatives.map((coop) => (
                    <div
                      key={coop.id}
                      onClick={() => navigate(`/cooperatives/${coop.id}`)}
                      className="p-5 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {coop.name}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(coop.memberRole)}`}>
                              {getRoleIcon(coop.memberRole)} {coop.memberRole || 'member'}
                            </span>
                          </div>
                          {coop.description && (
                            <p className="text-sm text-gray-600 mb-3">{coop.description}</p>
                          )}
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700 font-medium">{coop.memberCount} members</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Wallet className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700 font-medium">₦{coop.totalContributions?.toLocaleString() || 0}</span>
                            </div>
                            {coop.userTotalContributions !== undefined && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-green-700 font-semibold">₦{coop.userTotalContributions.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        {activity.cooperative && (
                          <p className="text-xs text-gray-600 mt-1">
                            {activity.cooperative.name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500">{formatTimeAgo(activity.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  fullWidth
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Cooperative
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  leftIcon={<DollarSign className="w-4 h-4" />}
                >
                  Make Contribution
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  leftIcon={<TrendingUp className="w-4 h-4" />}
                >
                  Request Loan
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  leftIcon={<ShoppingCart className="w-4 h-4" />}
                >
                  Group Purchase
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  leftIcon={<FileText className="w-4 h-4" />}
                >
                  View Reports
                </Button>
              </div>
            </Card>

            {/* Profile Card */}
            <Card className="p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">
                  {user?.firstName} {user?.lastName}
                </h4>
                <p className="text-sm text-gray-600 mb-4">{user?.email}</p>
                <Button variant="outline" size="sm" fullWidth>
                  Edit Profile
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Join Cooperative Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Join Cooperative</h3>
            <p className="text-gray-600 mb-6">Enter the cooperative code to join</p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter cooperative code"
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 mb-6"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowJoinModal(false)
                  setJoinCode('')
                }}
                disabled={isJoining}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleJoinCooperative}
                disabled={isJoining || !joinCode.trim()}
                loading={isJoining}
              >
                {isJoining ? 'Joining...' : 'Join'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create Cooperative Modal */}
      <CreateCooperativeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
