import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Users, DollarSign, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { Button, Card, useToast } from '../components/ui'
import { contributionApi, type ContributionPlan, type ContributionSubscription } from '../api/contributionApi'

export const ContributionPlansPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [plans, setPlans] = useState<ContributionPlan[]>([])
  const [mySubscriptions, setMySubscriptions] = useState<ContributionSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'subscribed' | 'available'>('all')

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    if (!id) return
    try {
      setIsLoading(true)
      const [plansRes, subscriptionsRes] = await Promise.all([
        contributionApi.getPlans(id),
        contributionApi.getMySubscriptions(id),
      ])

      if (plansRes.success) {
        setPlans(plansRes.data)
      }
      if (subscriptionsRes.success) {
        setMySubscriptions(subscriptionsRes.data)
      }
    } catch (error) {
      console.error('Error loading contribution plans:', error)
      toast.error('Failed to load contribution plans')
    } finally {
      setIsLoading(false)
    }
  }

  const isSubscribed = (planId: string) => {
    return mySubscriptions.some(
      (sub) => sub.planId === planId && sub.status === 'active'
    )
  }

  const getSubscription = (planId: string) => {
    return mySubscriptions.find((sub) => sub.planId === planId)
  }

  const filteredPlans = plans.filter((plan) => {
    if (filter === 'subscribed') return isSubscribed(plan.id)
    if (filter === 'available') return !isSubscribed(plan.id)
    return true
  })

  const getCategoryColor = (category: string) => {
    return category === 'compulsory' 
      ? { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
      : { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' }
  }

  const getFrequencyLabel = (frequency?: string) => {
    if (!frequency) return 'One-time'
    return frequency.charAt(0).toUpperCase() + frequency.slice(1)
  }

  const getAmountDisplay = (plan: ContributionPlan) => {
    if (plan.amountType === 'fixed') {
      return `₦${plan.fixedAmount?.toLocaleString() || 0}`
    }
    if (plan.minAmount && plan.maxAmount) {
      return `₦${plan.minAmount.toLocaleString()} - ₦${plan.maxAmount.toLocaleString()}`
    }
    if (plan.minAmount) {
      return `Min ₦${plan.minAmount.toLocaleString()}`
    }
    return 'Flexible'
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/cooperatives/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Cooperative</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contribution Plans</h1>
              <p className="text-gray-600 mt-1">Manage your contribution plans and subscriptions</p>
            </div>
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => navigate(`/cooperatives/${id}/contributions/create`)}
            >
              Create Plan
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'subscribed', 'available'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Plans Grid */}
        {filteredPlans.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'subscribed' ? 'No Active Subscriptions' : 'No Contribution Plans'}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'subscribed'
                  ? 'You have not subscribed to any contribution plans yet'
                  : 'Get started by creating your first contribution plan'}
              </p>
              {filter !== 'subscribed' && (
                <Button
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => navigate(`/cooperatives/${id}/contributions/create`)}
                >
                  Create Contribution Plan
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => {
              const categoryStyle = getCategoryColor(plan.category)
              const subscribed = isSubscribed(plan.id)
              const subscription = getSubscription(plan.id)

              return (
                <div
                  key={plan.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/cooperatives/${id}/contributions/${plan.id}`)}
                >
                  <Card className="p-6 hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
                    </div>
                    {subscribed && (
                      <div className="ml-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                  </div>

                  {/* Category Badge */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}
                    >
                      {plan.category === 'compulsory' ? 'Compulsory' : 'Optional'}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                      <DollarSign className="w-6 h-6 text-indigo-600" />
                      <span>{getAmountDisplay(plan)}</span>
                    </div>
                    {subscription && (
                      <p className="text-sm text-gray-600 mt-1">
                        Your subscription: ₦{subscription.amount.toLocaleString()}/{getFrequencyLabel(plan.frequency)}
                      </p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {plan.frequency && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{getFrequencyLabel(plan.frequency)}</span>
                      </div>
                    )}
                    {plan._count?.subscriptions !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{plan._count.subscriptions} subscribers</span>
                      </div>
                    )}
                    {plan.totalCollected !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4" />
                        <span>₦{plan.totalCollected.toLocaleString()} collected</span>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="pt-4 border-t border-gray-200">
                    {subscribed ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-600">
                          {subscription?.status === 'active' ? 'Active' : subscription?.status === 'paused' ? 'Paused' : 'Cancelled'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/cooperatives/${id}/contributions/${plan.id}`)
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Manage →
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        fullWidth
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/cooperatives/${id}/contributions/${plan.id}`)
                        }}
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
