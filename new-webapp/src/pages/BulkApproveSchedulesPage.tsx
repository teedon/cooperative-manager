import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Wallet, ChevronRight, CheckSquare, Square, Search, Calendar, Users, AlertCircle, Check } from 'lucide-react'
import { Button, Card, Input, useToast } from '../components/ui'
import {
  contributionApi,
  type ContributionPlan,
  type ScheduleDateInfo,
  type ScheduleDateMember,
  type ScheduleDateMembersResponse,
} from '../api/contributionApi'

type Step = 'select-plan' | 'select-date' | 'select-members'

export const BulkApproveSchedulesPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  // Navigation state
  const [currentStep, setCurrentStep] = useState<Step>('select-plan')

  // Plan selection state
  const [plans, setPlans] = useState<ContributionPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<ContributionPlan | null>(null)
  const [loadingPlans, setLoadingPlans] = useState(true)

  // Date selection state
  const [scheduleDates, setScheduleDates] = useState<ScheduleDateInfo[]>([])
  const [selectedDate, setSelectedDate] = useState<ScheduleDateInfo | null>(null)
  const [loadingDates, setLoadingDates] = useState(false)

  // Member selection state
  const [members, setMembers] = useState<ScheduleDateMember[]>([])
  const [membersData, setMembersData] = useState<ScheduleDateMembersResponse | null>(null)
  const [excludedMemberIds, setExcludedMemberIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingMembers, setLoadingMembers] = useState(false)

  // General state
  const [isApproving, setIsApproving] = useState(false)

  // Load contribution plans
  useEffect(() => {
    const loadPlans = async () => {
      if (!id) return

      setLoadingPlans(true)
      try {
        const response = await contributionApi.getPlans(id)
        if (response.success) {
          // Filter plans that have continuous frequency (scheduled contributions)
          const continuousPlans = response.data.filter(
            (plan: ContributionPlan) => plan.contributionType === 'continuous' && plan.frequency && plan.isActive
          )
          setPlans(continuousPlans)
        }
      } catch (error) {
        console.error('Error loading plans:', error)
        toast.error('Failed to load contribution plans')
      }
      setLoadingPlans(false)
    }
    loadPlans()
  }, [id])

  // Load schedule dates when plan is selected
  useEffect(() => {
    const loadScheduleDates = async () => {
      if (!selectedPlan || !id || currentStep !== 'select-date') return

      setLoadingDates(true)
      try {
        const response = await contributionApi.getPlanScheduleDates(id, selectedPlan.id)
        if (response.success) {
          setScheduleDates(response.data.scheduleDates)
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load schedule dates')
      }
      setLoadingDates(false)
    }
    loadScheduleDates()
  }, [selectedPlan, id, currentStep])

  // Load members when date is selected
  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedPlan || !selectedDate || !id || currentStep !== 'select-members') return

      setLoadingMembers(true)
      try {
        const response = await contributionApi.getMembersForScheduleDate(
          id,
          selectedPlan.id,
          selectedDate.date
        )
        if (response.success) {
          setMembersData(response.data)
          setMembers(response.data.members)
          setExcludedMemberIds(new Set())
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load members')
      }
      setLoadingMembers(false)
    }
    loadMembers()
  }, [selectedDate, selectedPlan, id, currentStep])

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members

    const query = searchQuery.toLowerCase()
    return members.filter((item) => {
      const memberName = `${item.member.firstName} ${item.member.lastName}`.toLowerCase()
      const email = item.member.email?.toLowerCase() || ''
      return memberName.includes(query) || email.includes(query)
    })
  }, [members, searchQuery])

  // Calculate totals for pending members
  const calculatedTotals = useMemo(() => {
    const pendingMembers = members.filter(
      (m) => m.status === 'pending' || m.status === 'overdue' || m.status === 'missing'
    )
    const includedMembers = pendingMembers.filter((m) => !excludedMemberIds.has(m.memberId))
    const missingCount = includedMembers.filter((m) => m.status === 'missing').length
    return {
      count: includedMembers.length,
      amount: includedMembers.reduce((sum, m) => sum + m.amount, 0),
      missingCount,
    }
  }, [members, excludedMemberIds])

  // Toggle member exclusion
  const toggleExclude = (memberId: string) => {
    setExcludedMemberIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(memberId)) {
        newSet.delete(memberId)
      } else {
        newSet.add(memberId)
      }
      return newSet
    })
  }

  // Select/Deselect all pending members
  const toggleSelectAll = () => {
    const pendingMemberIds = filteredMembers
      .filter((m) => m.status === 'pending' || m.status === 'overdue' || m.status === 'missing')
      .map((m) => m.memberId)
    const allExcluded = pendingMemberIds.every((id) => excludedMemberIds.has(id))

    if (allExcluded) {
      setExcludedMemberIds((prev) => {
        const newSet = new Set(prev)
        pendingMemberIds.forEach((id) => newSet.delete(id))
        return newSet
      })
    } else {
      setExcludedMemberIds((prev) => {
        const newSet = new Set(prev)
        pendingMemberIds.forEach((id) => newSet.add(id))
        return newSet
      })
    }
  }

  // Navigation handlers
  const handleSelectPlan = (plan: ContributionPlan) => {
    setSelectedPlan(plan)
    setCurrentStep('select-date')
    setSelectedDate(null)
    setScheduleDates([])
  }

  const handleSelectDate = (dateInfo: ScheduleDateInfo) => {
    if (dateInfo.pendingCount === 0) {
      toast.error('All members have already paid for this date')
      return
    }
    setSelectedDate(dateInfo)
    setCurrentStep('select-members')
    setMembers([])
    setSearchQuery('')
  }

  const handleBack = () => {
    if (currentStep === 'select-date') {
      setCurrentStep('select-plan')
      setSelectedPlan(null)
    } else if (currentStep === 'select-members') {
      setCurrentStep('select-date')
      setSelectedDate(null)
    }
  }

  // Perform bulk approval
  const handleBulkApprove = async () => {
    if (!selectedPlan || !selectedDate || !id) return

    const toApprove = calculatedTotals.count
    if (toApprove === 0) {
      toast.error('There are no members to approve payments for')
      return
    }

    const dateLabel = new Date(selectedDate.date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

    const missingNote =
      calculatedTotals.missingCount > 0
        ? `\n\n⚠️ ${calculatedTotals.missingCount} member(s) have no schedule and will have schedules created.`
        : ''

    const confirmMessage = `You are about to mark ${toApprove} member(s) as paid for "${selectedPlan.name}" on ${dateLabel}.\n\nTotal: ₦${calculatedTotals.amount.toLocaleString()}${missingNote}\n\nThis action cannot be undone.`

    if (!window.confirm(confirmMessage)) return

    setIsApproving(true)
    try {
      const response = await contributionApi.bulkApproveByDate(id, {
        planId: selectedPlan.id,
        scheduleDate: selectedDate.date,
        excludeMemberIds: Array.from(excludedMemberIds),
        includeMissingSchedules: true,
      })

      if (response.success) {
        const createdNote =
          response.data.createdSchedulesCount && response.data.createdSchedulesCount > 0
            ? `\n${response.data.createdSchedulesCount} schedule(s) were created.`
            : ''
        toast.success(
          `Successfully marked ${response.data.approvedCount} payments as paid.\nTotal: ₦${response.data.totalAmount.toLocaleString()}${createdNote}`
        )
        navigate(`/cooperatives/${id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve payments')
    }
    setIsApproving(false)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Format frequency for display
  const formatFrequency = (frequency?: string) => {
    switch (frequency) {
      case 'daily':
        return 'Daily'
      case 'weekly':
        return 'Weekly'
      case 'monthly':
        return 'Monthly'
      case 'yearly':
        return 'Yearly'
      default:
        return frequency || 'N/A'
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">Paid</span>
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">Pending</span>
      case 'overdue':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">Overdue</span>
      case 'missing':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">No Schedule</span>
      default:
        return null
    }
  }

  // Render step content
  const renderStepContent = () => {
    if (currentStep === 'select-plan') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Select Contribution Plan</h2>
            <span className="text-sm text-gray-500">{plans.length} plans available</span>
          </div>

          {loadingPlans ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : plans.length === 0 ? (
            <Card className="p-8 text-center">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No scheduled contribution plans available</p>
              <p className="text-sm text-gray-500 mt-1">
                Only continuous plans with schedules are shown here
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} onClick={() => handleSelectPlan(plan)} className="cursor-pointer">
                  <Card className="p-4 hover:border-blue-500 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Wallet className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-600">
                          {formatFrequency(plan.frequency)} •{' '}
                          {plan.amountType === 'fixed'
                            ? `₦${plan.fixedAmount?.toLocaleString()}`
                            : 'Variable'}
                        </p>
                        {plan._count?.subscriptions !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            {plan._count.subscriptions} subscriber
                            {plan._count.subscriptions !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (currentStep === 'select-date') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Select Schedule Date</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedPlan?.name}</p>
            </div>
            <span className="text-sm text-gray-500">{scheduleDates.length} dates</span>
          </div>

          {loadingDates ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : scheduleDates.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No schedule dates available</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {scheduleDates.map((dateInfo) => {
                const isPending = dateInfo.pendingCount > 0
                const isComplete = dateInfo.pendingCount === 0 && dateInfo.paidCount > 0

                return (
                  <div key={dateInfo.date} onClick={() => handleSelectDate(dateInfo)} className="cursor-pointer">
                    <Card
                      className={`p-4 transition-all ${
                        isComplete
                          ? 'bg-green-50 border-green-200'
                          : dateInfo.isToday
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-blue-500 hover:shadow-md'
                      }`}
                    >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-lg ${
                            isComplete
                              ? 'bg-green-200'
                              : dateInfo.isToday
                              ? 'bg-blue-200'
                              : 'bg-gray-100'
                          }`}
                        >
                          <Calendar
                            className={`w-6 h-6 ${
                              isComplete
                                ? 'text-green-700'
                                : dateInfo.isToday
                                ? 'text-blue-700'
                                : 'text-gray-600'
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            {formatDate(dateInfo.date)}
                            {dateInfo.isToday && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded">
                                Today
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span className="text-gray-600">
                              <Users className="w-4 h-4 inline mr-1" />
                              {dateInfo.totalMembers} total
                            </span>
                            {isPending && (
                              <span className="text-yellow-600 font-medium">
                                {dateInfo.pendingCount} pending
                              </span>
                            )}
                            {isComplete && (
                              <span className="text-green-600 font-medium flex items-center gap-1">
                                <Check className="w-4 h-4" />
                                Complete
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ₦{dateInfo.pendingAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">pending</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )
              })}
            </div>
          )}
        </div>
      )
    }

    if (currentStep === 'select-members') {
      const pendingMembers = filteredMembers.filter(
        (m) => m.status === 'pending' || m.status === 'overdue' || m.status === 'missing'
      )
      const allSelected = pendingMembers.every((m) => !excludedMemberIds.has(m.memberId))

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Select Members to Approve</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPlan?.name} • {selectedDate && formatDate(selectedDate.date)}
              </p>
            </div>
          </div>

          {/* Summary */}
          {membersData && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{membersData.totalMembers}</p>
                  <p className="text-xs text-gray-600">Total Members</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{membersData.pendingCount}</p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{membersData.paidCount}</p>
                  <p className="text-xs text-gray-600">Paid</p>
                </div>
              </div>
              {membersData.missingScheduleCount > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-300">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-700">
                      {membersData.missingScheduleCount} member(s) have no schedule. Schedules will be
                      created when approving.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Search and Select All */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={toggleSelectAll}>
              {allSelected ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Select All
                </>
              )}
            </Button>
          </div>

          {/* Members List */}
          {loadingMembers ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No members found</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((item) => {
                const isPending =
                  item.status === 'pending' || item.status === 'overdue' || item.status === 'missing'
                const isSelected = !excludedMemberIds.has(item.memberId)

                return (
                  <div
                    key={item.memberId}
                    onClick={() => isPending && toggleExclude(item.memberId)}
                    className={`${
                      isPending ? 'cursor-pointer' : ''
                    }`}
                  >
                    <Card className={`p-4 ${isPending ? 'hover:border-blue-500' : 'opacity-60'} transition-all`}>
                    <div className="flex items-center gap-4">
                      {isPending && (
                        <div className="shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {item.member.firstName} {item.member.lastName}
                          </h3>
                          {item.member.isOfflineMember && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                              Offline
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{item.member.email}</p>
                        {!item.hasSchedule && (
                          <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Schedule will be created
                          </p>
                        )}
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">₦{item.amount.toLocaleString()}</p>
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )
              })}
            </div>
          )}

          {/* Summary Footer */}
          {calculatedTotals.count > 0 && (
            <Card className="p-4 bg-gray-50 border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Selected for approval</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {calculatedTotals.count} member{calculatedTotals.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total amount</p>
                  <p className="text-xl font-bold text-blue-600">
                    ₦{calculatedTotals.amount.toLocaleString()}
                  </p>
                </div>
              </div>
              {calculatedTotals.missingCount > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {calculatedTotals.missingCount} member(s) will have schedules created
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Approve Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleBulkApprove}
              disabled={isApproving || calculatedTotals.count === 0}
              className="flex-1"
            >
              {isApproving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Approving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Approve {calculatedTotals.count} Payment{calculatedTotals.count !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={currentStep === 'select-plan' ? () => navigate(`/cooperatives/${id}`) : handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulk Approve Schedules</h1>
              <p className="text-sm text-gray-600 mt-1">
                Approve contribution payments for multiple members at once
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  currentStep === 'select-plan'
                    ? 'bg-blue-600 text-white'
                    : 'bg-green-600 text-white'
                }`}
              >
                {currentStep === 'select-plan' ? '1' : <Check className="w-5 h-5" />}
              </div>
              <span
                className={`text-sm font-medium ${
                  currentStep === 'select-plan' ? 'text-blue-600' : 'text-green-600'
                }`}
              >
                Select Plan
              </span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300 mx-4">
              <div
                className={`h-full transition-all ${
                  currentStep !== 'select-plan' ? 'bg-green-600' : 'bg-gray-300'
                }`}
              ></div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  currentStep === 'select-date'
                    ? 'bg-blue-600 text-white'
                    : currentStep === 'select-members'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {currentStep === 'select-members' ? <Check className="w-5 h-5" /> : '2'}
              </div>
              <span
                className={`text-sm font-medium ${
                  currentStep === 'select-date'
                    ? 'text-blue-600'
                    : currentStep === 'select-members'
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}
              >
                Select Date
              </span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300 mx-4">
              <div
                className={`h-full transition-all ${
                  currentStep === 'select-members' ? 'bg-green-600' : 'bg-gray-300'
                }`}
              ></div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  currentStep === 'select-members'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                3
              </div>
              <span
                className={`text-sm font-medium ${
                  currentStep === 'select-members' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                Select Members
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderStepContent()}</div>
    </div>
  )
}
