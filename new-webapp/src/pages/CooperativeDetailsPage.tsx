import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../hooks/useAuth'
import { Button, Card, useToast } from '../components/ui'
import {
  ArrowLeft,
  Users,
  DollarSign,
  Settings,
  UserPlus,
  UserCheck,
  UserX,
  Copy,
  CheckCircle2,
  Shield,
  Wallet,
  FileText,
  HandCoins,
  Search,
  MoreVertical,
  Crown,
  Plus,
  CreditCard,
  BarChart3,
  Receipt,
  UserCog,
  CheckCheck,
  ChevronRight,
  Mail,
} from 'lucide-react'
import { cooperativeApi } from '../api/cooperativeApi'
import { loanApi, type Loan } from '../api/loanApi'
import { InviteMembersModal } from './InviteMembersModal'
import { BulkOfflineMembersModal } from './BulkOfflineMembersModal'
import type { Cooperative, CooperativeMember } from '../types'

type TabType = 'overview' | 'members' | 'contributions' | 'loans'

const GRADIENT_COLORS: Record<string, [string, string]> = {
  ocean: ['#667eea', '#764ba2'],
  sunset: ['#f093fb', '#f5576c'],
  forest: ['#56ab2f', '#a8e063'],
  lavender: ['#a18cd1', '#fbc2eb'],
  coral: ['#ff9a9e', '#fecfef'],
  midnight: ['#2c3e50', '#3498db'],
  emerald: ['#11998e', '#38ef7d'],
  rose: ['#ee0979', '#ff6a00'],
  slate: ['#536976', '#292e49'],
  amber: ['#f12711', '#f5af19'],
}

export const CooperativeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAppSelector((state) => state.auth)

  const [cooperative, setCooperative] = useState<Cooperative | null>(null)
  const [members, setMembers] = useState<CooperativeMember[]>([])
  const [pendingMembers, setPendingMembers] = useState<CooperativeMember[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [memberFilter, setMemberFilter] = useState<'all' | 'online' | 'offline'>('all')
  const [copiedCode, setCopiedCode] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)

  // Get current user's membership and role
  const currentMember = useMemo(() => {
    if (!user || !members.length) return null
    const member = members.find((m) => m.userId === user.id)
    console.log('Current user:', user)
    console.log('Current member:', member)
    return member
  }, [user, members])

  const isAdmin = currentMember?.role === 'admin'
  const isAdminOrModerator = isAdmin || currentMember?.role === 'moderator'

  console.log('isAdmin:', isAdmin, 'isAdminOrModerator:', isAdminOrModerator, 'Role:', currentMember?.role)

  useEffect(() => {
    if (id) {
      loadCooperativeData()
    }
  }, [id])

  const loadCooperativeData = async () => {
    try {
      setIsLoading(true)
      
      // Load cooperative details
      const coopResponse = await cooperativeApi.getById(id!)
      if (coopResponse.success) {
        setCooperative(coopResponse.data)
        console.log('Cooperative loaded:', coopResponse.data)
      } else {
        toast.error('Failed to load cooperative details')
        return
      }

      // Load members (non-blocking)
      try {
        const membersResponse = await cooperativeApi.getMembers(id!)
        if (membersResponse.success) {
          console.log('Members loaded:', membersResponse.data)
          setMembers(membersResponse.data.filter((m) => m.status === 'active'))
          setPendingMembers(membersResponse.data.filter((m) => m.status === 'pending'))
        }
      } catch (error) {
        console.error('Failed to load members:', error)
      }

      // Load loans (non-blocking)
      try {
        const loansResponse = await loanApi.getLoans(id!)
        if (loansResponse.success) {
          console.log('Loans loaded:', loansResponse.data)
          setLoans(loansResponse.data)
        }
      } catch (error) {
        console.error('Failed to load loans:', error)
      }
    } catch (error: any) {
      console.error('Failed to load cooperative:', error)
      toast.error('Failed to load cooperative details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (cooperative?.code) {
      navigator.clipboard.writeText(cooperative.code)
      setCopiedCode(true)
      toast.success('Cooperative code copied!')
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleApproveMember = async (memberId: string, memberName: string) => {
    try {
      await cooperativeApi.approveMember(memberId)
      toast.success(`${memberName} has been approved`)
      loadCooperativeData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve member')
    }
  }

  const handleRejectMember = async (memberId: string, memberName: string) => {
    try {
      await cooperativeApi.rejectMember(memberId)
      toast.success(`${memberName}'s request has been rejected`)
      loadCooperativeData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject member')
    }
  }

  const getGradientStyle = () => {
    if (cooperative?.useGradient && cooperative?.gradientPreset) {
      const colors = GRADIENT_COLORS[cooperative.gradientPreset] || GRADIENT_COLORS.ocean
      return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
    }
    if (cooperative?.imageUrl) {
      return `url(${cooperative.imageUrl})`
    }
    return 'linear-gradient(135deg, #667eea, #764ba2)'
  }

  const getRoleBadgeColor = (role: string) => {
    if (role === 'admin') return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    if (role === 'moderator') return 'bg-blue-100 text-blue-800 border-blue-300'
    return 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Crown className="w-4 h-4" />
    if (role === 'moderator') return <Shield className="w-4 h-4" />
    return <Users className="w-4 h-4" />
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      memberFilter === 'all' ||
      (memberFilter === 'offline' && member.isOfflineMember) ||
      (memberFilter === 'online' && !member.isOfflineMember)

    return matchesSearch && matchesFilter
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cooperative details...</p>
        </div>
      </div>
    )
  }

  if (!cooperative) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cooperative Not Found</h2>
          <p className="text-gray-600 mb-6">
            The cooperative you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  const tabs = [
    { key: 'overview' as TabType, label: 'Overview', icon: <FileText className="w-4 h-4" /> },
    { key: 'members' as TabType, label: 'Members', icon: <Users className="w-4 h-4" /> },
    {
      key: 'contributions' as TabType,
      label: 'Contributions',
      icon: <DollarSign className="w-4 h-4" />,
    },
    { key: 'loans' as TabType, label: 'Loans', icon: <HandCoins className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 pb-8">
      {/* Header with Gradient Banner */}
      <div
        className="relative h-48 overflow-hidden"
        style={{
          background: getGradientStyle(),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6 h-full flex flex-col justify-between py-6">
          {/* Back Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="self-start bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
          >
            Back
          </Button>

          {/* Cooperative Info */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                {cooperative.name}
              </h1>
              {currentMember?.role && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${getRoleBadgeColor(currentMember.role)} bg-opacity-90`}
                >
                  {getRoleIcon(currentMember.role)}
                  {currentMember.role}
                </span>
              )}
            </div>
            {cooperative.description && (
              <p className="text-white/90 text-lg max-w-2xl drop-shadow">
                {cooperative.description}
              </p>
            )}

            {/* Cooperative Code */}
            <div className="flex items-center gap-2 mt-4">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                <span className="text-white/70 text-sm mr-2">Code:</span>
                <span className="text-white font-mono font-bold text-lg">
                  {cooperative.code}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-all duration-300"
                title="Copy code"
              >
                {copiedCode ? (
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                ) : (
                  <Copy className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        {/* Tabs */}
        <Card className="p-2 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap
                  ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Members</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {cooperative.memberCount}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-100 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Contributions</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ₦{cooperative.totalContributions?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-green-100 rounded-xl">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Loans</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {loans.filter((l) => ['disbursed', 'repaying'].includes(l.status)).length}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-100 rounded-xl">
                    <HandCoins className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Balance</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ₦
                      {(
                        (cooperative.totalContributions || 0) -
                        (cooperative.totalExpenses || 0)
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-100 rounded-xl">
                    <Wallet className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Pending Members (Admin/Moderator Only) */}
            {isAdminOrModerator && pendingMembers.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <UserPlus className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Pending Approvals</h3>
                      <p className="text-sm text-gray-600">
                        {pendingMembers.length} member{pendingMembers.length !== 1 ? 's' : ''}{' '}
                        waiting for approval
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {pendingMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-orange-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {member.user?.firstName} {member.user?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{member.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRejectMember(
                              member.id,
                              `${member.user?.firstName} ${member.user?.lastName}`
                            )
                          }
                          leftIcon={<UserX className="w-4 h-4" />}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            handleApproveMember(
                              member.id,
                              `${member.user?.firstName} ${member.user?.lastName}`
                            )
                          }
                          leftIcon={<UserCheck className="w-4 h-4" />}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Admin/Moderator Actions */}
            {isAdminOrModerator && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {isAdmin ? 'Admin' : 'Moderator'} Actions
                    </h3>
                    <p className="text-sm text-gray-600">Manage your cooperative</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Create Contribution Plan */}
                  <button 
                    onClick={() => navigate(`/cooperatives/${id}/contributions/create`)}
                    className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 flex items-center gap-4 group"
                  >
                    <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Plus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-900">Create Contribution Plan</h4>
                      <p className="text-sm text-gray-600">Set up a new contribution plan</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </button>

                  {/* Approve Subscription Payments */}
                  <button className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 flex items-center gap-4 group">
                    <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-900">Approve Subscription Payments</h4>
                      <p className="text-sm text-gray-600">Review member subscription payments</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </button>

                  {/* View Ledger */}
                  <button className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300 flex items-center gap-4 group">
                    <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                      <BarChart3 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-900">View Ledger</h4>
                      <p className="text-sm text-gray-600">Full cooperative financial records</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </button>

                  {/* Expenses */}
                  <button 
                    onClick={() => navigate(`/cooperatives/${id}/expenses`)}
                    className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-rose-500 hover:bg-rose-50 transition-all duration-300 flex items-center gap-4 group"
                  >
                    <div className="p-3 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
                      <Receipt className="w-6 h-6 text-rose-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-900">Expenses</h4>
                      <p className="text-sm text-gray-600">Track and approve cooperative expenses</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-rose-600 transition-colors" />
                  </button>

                  {/* Reports */}
                  <button 
                    onClick={() => navigate(`/cooperatives/${id}/reports`)}
                    className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 flex items-center gap-4 group"
                  >
                    <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-900">Reports</h4>
                      <p className="text-sm text-gray-600">Generate and export financial reports</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </button>

                  {/* Manage Admins (Admin only) */}
                  {isAdmin && (
                    <button 
                      onClick={() => navigate(`/cooperatives/${id}/admin-management`)}
                      className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all duration-300 flex items-center gap-4 group"
                    >
                      <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                        <UserCog className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-gray-900">Manage Admins</h4>
                        <p className="text-sm text-gray-600">Add and configure admin permissions</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                    </button>
                  )}

                  {/* Bulk Approve Schedules (Admin only) */}
                  {isAdmin && (
                    <button 
                      onClick={() => navigate(`/cooperatives/${id}/bulk-approve-schedules`)}
                      className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 flex items-center gap-4 group"
                    >
                      <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <CheckCheck className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-gray-900">Bulk Approve Schedules</h4>
                        <p className="text-sm text-gray-600">Approve multiple contribution payments at once</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </button>
                  )}

                  {/* Invite Members */}
                  {isAdminOrModerator && (
                    <button 
                      onClick={() => setShowInviteModal(true)}
                      className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all duration-300 flex items-center gap-4 group"
                    >
                      <div className="p-3 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
                        <Mail className="w-6 h-6 text-teal-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-gray-900">Invite Members</h4>
                        <p className="text-sm text-gray-600">Send invitations via email or WhatsApp</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
                    </button>
                  )}

                  {/* Offline Members */}
                  <button 
                    onClick={() => setShowBulkUploadModal(true)}
                    className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all duration-300 flex items-center gap-4 group"
                  >
                    <div className="p-3 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition-colors">
                      <Users className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-900">Offline Members</h4>
                      <p className="text-sm text-gray-600">Manage members without mobile devices</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                  </button>

                  {/* Subscription Management (Admin only) */}
                  {isAdmin && (
                    <button className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all duration-300 flex items-center gap-4 group">
                      <div className="p-3 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
                        <CreditCard className="w-6 h-6 text-teal-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-gray-900">Subscription</h4>
                        <p className="text-sm text-gray-600">Manage plan and billing</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
                    </button>
                  )}

                  {/* Cooperative Settings (Admin only) */}
                  {isAdmin && (
                    <button 
                      onClick={() => navigate(`/cooperatives/${id}/settings`)}
                      className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-500 hover:bg-gray-50 transition-all duration-300 flex items-center gap-4 group"
                    >
                      <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                        <Settings className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-gray-900">Cooperative Settings</h4>
                        <p className="text-sm text-gray-600">Name, description, and appearance</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </button>
                  )}
                </div>
              </Card>
            )}

            {/* Quick Access for All Members */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Access</h3>
              <div className="space-y-3">
                {/* My Dashboard */}
                <button className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 flex items-center gap-4 group">
                  <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900">My Dashboard</h4>
                    <p className="text-sm text-gray-600">View my contributions and virtual balance</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>

                {/* Make Contribution */}
                <button className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 flex items-center gap-4 group">
                  <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900">Make Contribution</h4>
                    <p className="text-sm text-gray-600">Record a new payment</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                </button>

                {/* Request Loan */}
                <button
                  onClick={() => navigate(`/cooperatives/${cooperative.id}/loans/request`)}
                  className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 flex items-center gap-4 group"
                >
                  <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <HandCoins className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900">Request Loan</h4>
                    <p className="text-sm text-gray-600">Apply for a cooperative loan</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'online', 'offline'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setMemberFilter(filter as typeof memberFilter)}
                      className={`
                        px-4 py-3 rounded-xl font-medium transition-all duration-300 capitalize
                        ${
                          memberFilter === filter
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Members List */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Members ({filteredMembers.length})
                </h3>
                {isAdminOrModerator && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      leftIcon={<Mail className="w-4 h-4" />}
                      onClick={() => setShowInviteModal(true)}
                    >
                      Invite Members
                    </Button>
                    <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
                      Add Member
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No members found</p>
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {(
                            member.user?.firstName?.[0] ||
                            member.firstName?.[0] ||
                            'M'
                          ).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {member.user?.firstName || member.firstName}{' '}
                            {member.user?.lastName || member.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {member.user?.email || 'Offline Member'}
                          </p>
                          {member.virtualBalance !== null && (
                            <p className="text-sm text-gray-500">
                              Balance: ₦{member.virtualBalance.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-1 ${getRoleBadgeColor(member.role)}`}
                        >
                          {getRoleIcon(member.role)}
                          {member.role}
                        </span>
                        {isAdminOrModerator && (
                          <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'contributions' && (
          <div className="space-y-6">
            {/* View All Plans Button */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Contribution Plans</h3>
                  <p className="text-gray-600">Manage and subscribe to contribution plans</p>
                </div>
                <Button
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => navigate(`/cooperatives/${id}/contributions`)}
                >
                  View All Plans
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quick Actions */}
                <button
                  onClick={() => navigate(`/cooperatives/${id}/contributions`)}
                  className="p-4 bg-linear-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-6 h-6 text-indigo-600" />
                    <h4 className="font-semibold text-gray-900">Browse Plans</h4>
                  </div>
                  <p className="text-sm text-gray-600">View available contribution plans and subscribe</p>
                </button>

                {isAdminOrModerator && (
                  <button
                    onClick={() => navigate(`/cooperatives/${id}/contributions/create`)}
                    className="p-4 bg-linear-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl hover:border-blue-400 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Plus className="w-6 h-6 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Create Plan</h4>
                    </div>
                    <p className="text-sm text-gray-600">Set up a new contribution plan</p>
                  </button>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'loans' && (
          <div className="space-y-6">
            {/* Admin Actions */}
            {isAdmin && (
              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<Settings className="w-4 h-4" />}
                    onClick={() => navigate(`/cooperatives/${id}/loan-types`)}
                  >
                    Configure Loan Types
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => navigate(`/cooperatives/${id}/loans?filter=pending`)}
                  >
                    Pending Approvals
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => navigate(`/cooperatives/${id}/loans/initiate`)}
                  >
                    Initiate Loan for Member
                  </Button>
                </div>
              </Card>
            )}

            {/* Request New Loan Button */}
            <Card className="p-4">
              <Button
                variant="primary"
                fullWidth
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => navigate(`/cooperatives/${id}/loans/request`)}
              >
                + Request New Loan
              </Button>
            </Card>

            {/* Loans List */}
            {loans.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No loans yet</h3>
                  <p className="text-gray-600 mb-6">
                    Request a loan or wait for admin to initiate one
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/cooperatives/${id}/loans/request`)}
                  >
                    Request Loan
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {loans.map((loan) => {
                  const getStatusColor = (status: string) => {
                    const colors: Record<string, string> = {
                      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                      approved: 'bg-blue-100 text-blue-800 border-blue-300',
                      rejected: 'bg-red-100 text-red-800 border-red-300',
                      disbursed: 'bg-green-100 text-green-800 border-green-300',
                      repaying: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                      completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                      defaulted: 'bg-gray-100 text-gray-800 border-gray-300',
                    }
                    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
                  }

                  return (
                    <div
                      key={loan.id}
                      onClick={() => navigate(`/cooperatives/${id}/loans/${loan.id}`)}
                      className="cursor-pointer"
                    >
                      <Card className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            ₦{loan.amount.toLocaleString()}
                          </h3>
                          {loan.loanType && (
                            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded">
                              {loan.loanType.name}
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(loan.status)}`}
                        >
                          {loan.status}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-3 line-clamp-2">{loan.purpose}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{loan.duration} months</span>
                        <span>•</span>
                        <span>{loan.interestRate}% interest</span>
                      </div>

                      {/* Repayment Progress for active loans */}
                      {['disbursed', 'repaying'].includes(loan.status) && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Repayment Progress</span>
                            <span className="font-semibold">
                              ₦{loan.amountPaid.toLocaleString()} / ₦
                              {loan.totalRepayable.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min((loan.amountPaid / loan.totalRepayable) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      </Card>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Members Modal */}
      {showInviteModal && cooperative && (
        <InviteMembersModal
          cooperativeId={id!}
          cooperativeName={cooperative.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Bulk Upload Offline Members Modal */}
      {showBulkUploadModal && cooperative && (
        <BulkOfflineMembersModal
          isOpen={showBulkUploadModal}
          onClose={() => setShowBulkUploadModal(false)}
          cooperativeId={id!}
          onSuccess={() => {
            loadCooperativeData()
            toast.success('Offline members uploaded successfully!')
          }}
        />
      )}
    </div>
  )
}
