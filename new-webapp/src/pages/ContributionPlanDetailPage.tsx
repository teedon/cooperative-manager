import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  TrendingUp,
} from 'lucide-react'
import { Button, Card, Input, useToast } from '../components/ui'
import {
  contributionApi,
  type ContributionPlan,
  type ContributionSubscription,
  type SubscribeToContributionDto,
} from '../api/contributionApi'

export const ContributionPlanDetailPage = () => {
  const { id, planId } = useParams<{ id: string; planId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [plan, setPlan] = useState<ContributionPlan | null>(null)
  const [mySubscription, setMySubscription] = useState<ContributionSubscription | null>(null)
  const [allSubscriptions, setAllSubscriptions] = useState<ContributionSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [subscribeAmount, setSubscribeAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => {
    if (planId) {
      loadData()
    }
  }, [planId])

  const loadData = async () => {
    if (!planId || !id) return

    try {
      setIsLoading(true)
      const [planRes, mySubsRes] = await Promise.all([
        contributionApi.getPlan(planId),
        contributionApi.getMySubscriptions(id),
      ])

      if (planRes.success) {
        setPlan(planRes.data)
      }

      if (mySubsRes.success) {
        const subscription = mySubsRes.data.find((sub: ContributionSubscription) => sub.planId === planId)
        setMySubscription(subscription || null)
      }

      // Load all subscriptions if admin
      try {
        const allSubsRes = await contributionApi.getPlanSubscriptions(planId)
        if (allSubsRes.success) {
          setAllSubscriptions(allSubsRes.data)
        }
      } catch (error) {
        // Not admin, ignore
      }
    } catch (error) {
      console.error('Error loading plan:', error)
      toast.error('Failed to load contribution plan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!plan || !planId) return

    if (plan.amountType === 'fixed') {
      // Subscribe with fixed amount
      await submitSubscription(plan.fixedAmount!)
    } else {
      // Show modal for flexible amount
      setSubscribeAmount('')
      setShowSubscribeModal(true)
    }
  }

  const submitSubscription = async (amount: number) => {
    if (!planId) return

    if (amount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    if (plan?.minAmount && amount < plan.minAmount) {
      toast.error(`Amount must be at least ₦${plan.minAmount.toLocaleString()}`)
      return
    }

    if (plan?.maxAmount && amount > plan.maxAmount) {
      toast.error(`Amount cannot exceed ₦${plan.maxAmount.toLocaleString()}`)
      return
    }

    try {
      setIsSubmitting(true)
      const data: SubscribeToContributionDto = { amount }
      const response = await contributionApi.subscribeToPlan(planId, data)

      if (response.success) {
        toast.success('Successfully subscribed to contribution plan!')
        setShowSubscribeModal(false)
        loadData()
      } else {
        toast.error(response.message || 'Failed to subscribe')
      }
    } catch (error: any) {
      console.error('Error subscribing:', error)
      toast.error(error.response?.data?.message || 'Failed to subscribe')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSubscription = async (status: 'active' | 'paused' | 'cancelled') => {
    if (!mySubscription) return

    try {
      setIsSubmitting(true)
      const response = await contributionApi.updateSubscription(mySubscription.id, { status })

      if (response.success) {
        const statusText = status === 'paused' ? 'paused' : status === 'active' ? 'resumed' : 'cancelled'
        toast.success(`Subscription ${statusText} successfully`)
        setShowCancelModal(false)
        loadData()
      } else {
        toast.error(response.message || 'Failed to update subscription')
      }
    } catch (error: any) {
      console.error('Error updating subscription:', error)
      toast.error(error.response?.data?.message || 'Failed to update subscription')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFrequencyLabel = (frequency?: string) => {
    if (!frequency) return 'One-time'
    return frequency.charAt(0).toUpperCase() + frequency.slice(1)
  }

  const getCategoryStyle = (category: string) => {
    return category === 'compulsory'
      ? { bg: 'bg-red-100', text: 'text-red-700' }
      : { bg: 'bg-blue-100', text: 'text-blue-700' }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 }
      case 'paused':
        return { bg: 'bg-amber-100', text: 'text-amber-700', icon: Pause }
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Plan Not Found</h3>
              <p className="text-gray-600 mb-6">The contribution plan you're looking for doesn't exist.</p>
              <Button variant="primary" onClick={() => navigate(`/cooperatives/${id}/contributions`)}>
                Back to Plans
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const categoryStyle = getCategoryStyle(plan.category)
  const statusStyle = mySubscription ? getStatusStyle(mySubscription.status) : null
  const StatusIcon = statusStyle?.icon

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/cooperatives/${id}/contributions`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Contribution Plans</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
              <p className="text-gray-600 mt-1">{plan.description}</p>
            </div>
            {/* Admin actions could go here */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Details</h2>

              <div className="space-y-4">
                {/* Category */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Category</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryStyle.bg} ${categoryStyle.text}`}>
                    {plan.category === 'compulsory' ? 'Compulsory' : 'Optional'}
                  </span>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Amount Type</span>
                  <span className="font-semibold text-gray-900">
                    {plan.amountType === 'fixed' ? 'Fixed Amount' : 'Flexible Amount'}
                  </span>
                </div>

                {plan.amountType === 'fixed' && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Fixed Amount</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ₦{plan.fixedAmount?.toLocaleString() || 0}
                    </span>
                  </div>
                )}

                {plan.amountType === 'notional' && (
                  <>
                    {plan.minAmount && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-600">Minimum Amount</span>
                        <span className="font-semibold text-gray-900">₦{plan.minAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {plan.maxAmount && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-600">Maximum Amount</span>
                        <span className="font-semibold text-gray-900">₦{plan.maxAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Schedule */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Schedule Type</span>
                  <span className="font-semibold text-gray-900">
                    {plan.contributionType === 'continuous' ? 'Continuous' : 'Period-based'}
                  </span>
                </div>

                {plan.frequency && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Frequency</span>
                    <span className="font-semibold text-gray-900">{getFrequencyLabel(plan.frequency)}</span>
                  </div>
                )}

                {/* Dates */}
                {plan.startDate && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Start Date</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(plan.startDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {plan.endDate && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">End Date</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(plan.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">Plan Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Statistics (if admin) */}
            {allSubscriptions.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-2 text-indigo-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">Total Subscribers</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-900">{allSubscriptions.length}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Active Subscriptions</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {allSubscriptions.filter((s) => s.status === 'active').length}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* My Subscription */}
            {mySubscription ? (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">My Subscription</h2>

                {/* Status Badge */}
                <div className="mb-4">
                  {StatusIcon && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${statusStyle.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${statusStyle.text}`} />
                      <span className={`font-medium ${statusStyle.text}`}>
                        {mySubscription.status.charAt(0).toUpperCase() + mySubscription.status.slice(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">My Contribution Amount</p>
                  <p className="text-3xl font-bold text-gray-900">₦{mySubscription.amount.toLocaleString()}</p>
                  {plan.frequency && (
                    <p className="text-sm text-gray-600 mt-1">per {getFrequencyLabel(plan.frequency).toLowerCase()}</p>
                  )}
                </div>

                {/* Total Paid */}
                {mySubscription.totalPaid !== undefined && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700 mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-green-900">₦{mySubscription.totalPaid.toLocaleString()}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  {mySubscription.status === 'active' && (
                    <>
                      <Button
                        variant="outline"
                        fullWidth
                        leftIcon={<Pause className="w-4 h-4" />}
                        onClick={() => handleUpdateSubscription('paused')}
                        disabled={isSubmitting}
                      >
                        Pause Subscription
                      </Button>
                      <Button
                        variant="outline"
                        fullWidth
                        leftIcon={<XCircle className="w-4 h-4" />}
                        onClick={() => setShowCancelModal(true)}
                        disabled={isSubmitting}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Cancel Subscription
                      </Button>
                    </>
                  )}

                  {mySubscription.status === 'paused' && (
                    <>
                      <Button
                        variant="primary"
                        fullWidth
                        leftIcon={<Play className="w-4 h-4" />}
                        onClick={() => handleUpdateSubscription('active')}
                        disabled={isSubmitting}
                      >
                        Resume Subscription
                      </Button>
                      <Button
                        variant="outline"
                        fullWidth
                        leftIcon={<XCircle className="w-4 h-4" />}
                        onClick={() => setShowCancelModal(true)}
                        disabled={isSubmitting}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Cancel Subscription
                      </Button>
                    </>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  Subscribed on {new Date(mySubscription.subscribedAt).toLocaleDateString()}
                </p>
              </Card>
            ) : (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Subscribe to Plan</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Start contributing to this plan by subscribing now
                </p>

                {plan.amountType === 'fixed' && (
                  <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-indigo-700 mb-1">Contribution Amount</p>
                    <p className="text-3xl font-bold text-indigo-900">₦{plan.fixedAmount?.toLocaleString()}</p>
                    {plan.frequency && (
                      <p className="text-sm text-indigo-700 mt-1">per {getFrequencyLabel(plan.frequency).toLowerCase()}</p>
                    )}
                  </div>
                )}

                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleSubscribe}
                  disabled={!plan.isActive}
                >
                  {plan.isActive ? 'Subscribe Now' : 'Plan Inactive'}
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Subscribe Modal */}
        {showSubscribeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Amount</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contribution Amount (₦)
                </label>
                <Input
                  type="number"
                  value={subscribeAmount}
                  onChange={(e) => setSubscribeAmount(e.target.value)}
                  placeholder="Enter amount"
                  min={plan.minAmount || 0}
                  max={plan.maxAmount}
                  step="0.01"
                  autoFocus
                />
                {plan.minAmount && (
                  <p className="text-xs text-gray-500 mt-1">Minimum: ₦{plan.minAmount.toLocaleString()}</p>
                )}
                {plan.maxAmount && (
                  <p className="text-xs text-gray-500">Maximum: ₦{plan.maxAmount.toLocaleString()}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSubscribeModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => submitSubscription(parseFloat(subscribeAmount))}
                  disabled={isSubmitting || !subscribeAmount}
                  className="flex-1"
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cancel Subscription?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel your subscription to this plan? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isSubmitting}
                >
                  Keep Subscription
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleUpdateSubscription('cancelled')}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? 'Cancelling...' : 'Yes, Cancel'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
