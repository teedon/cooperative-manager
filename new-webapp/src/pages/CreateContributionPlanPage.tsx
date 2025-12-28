import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Calendar, DollarSign } from 'lucide-react'
import { Button, Input, Card, useToast } from '../components/ui'
import { contributionApi, type CreateContributionPlanDto } from '../api/contributionApi'

export const CreateContributionPlanPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [formData, setFormData] = useState<CreateContributionPlanDto>({
    name: '',
    description: '',
    category: 'optional',
    amountType: 'fixed',
    fixedAmount: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    contributionType: 'continuous',
    frequency: 'monthly',
    startDate: '',
    endDate: '',
    isActive: true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!id) return

    // Validation
    if (!formData.name.trim()) {
      toast.error('Plan name is required')
      return
    }

    if (formData.amountType === 'fixed' && (!formData.fixedAmount || formData.fixedAmount <= 0)) {
      toast.error('Fixed amount must be greater than 0')
      return
    }

    if (formData.amountType === 'notional') {
      if (formData.minAmount && formData.minAmount <= 0) {
        toast.error('Minimum amount must be greater than 0')
        return
      }
      if (formData.maxAmount && formData.maxAmount <= 0) {
        toast.error('Maximum amount must be greater than 0')
        return
      }
      if (
        formData.minAmount &&
        formData.maxAmount &&
        formData.minAmount > formData.maxAmount
      ) {
        toast.error('Minimum amount cannot be greater than maximum amount')
        return
      }
    }

    try {
      setIsSubmitting(true)

      // Prepare data
      const data: CreateContributionPlanDto = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        category: formData.category,
        amountType: formData.amountType,
        contributionType: formData.contributionType,
        isActive: formData.isActive,
      }

      // Add amount fields based on type
      if (formData.amountType === 'fixed') {
        data.fixedAmount = formData.fixedAmount
      } else {
        data.minAmount = formData.minAmount
        data.maxAmount = formData.maxAmount
      }

      // Add frequency and dates for continuous plans
      if (formData.contributionType === 'continuous') {
        data.frequency = formData.frequency
        if (formData.startDate) {
          data.startDate = new Date(formData.startDate).toISOString()
        }
        if (formData.endDate) {
          data.endDate = new Date(formData.endDate).toISOString()
        }
      }

      const response = await contributionApi.createPlan(id, data)

      if (response.success) {
        toast.success('Contribution plan created successfully')
        navigate(`/cooperatives/${id}/contributions/${response.data.id}`)
      } else {
        toast.error(response.message || 'Failed to create contribution plan')
      }
    } catch (error: any) {
      console.error('Error creating contribution plan:', error)
      toast.error(error.response?.data?.message || 'Failed to create contribution plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate(`/cooperatives/${id}/contributions`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Contribution Plans</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Create Contribution Plan</h1>
          <p className="text-gray-600 mt-1">Set up a new contribution plan for your cooperative</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Monthly Savings, Emergency Fund"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the purpose of this contribution plan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, category: 'compulsory' })}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        formData.category === 'compulsory'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900">Compulsory</h3>
                      <p className="text-sm text-gray-600">All members must contribute</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, category: 'optional' })}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        formData.category === 'optional'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900">Optional</h3>
                      <p className="text-sm text-gray-600">Members can choose to subscribe</p>
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Amount Configuration */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Amount Configuration
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Type *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, amountType: 'fixed' })}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        formData.amountType === 'fixed'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900">Fixed Amount</h3>
                      <p className="text-sm text-gray-600">Same amount for all members</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, amountType: 'notional' })}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        formData.amountType === 'notional'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900">Flexible Amount</h3>
                      <p className="text-sm text-gray-600">Members choose their amount</p>
                    </button>
                  </div>
                </div>

                {formData.amountType === 'fixed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fixed Amount (₦) *
                    </label>
                    <Input
                      type="number"
                      value={formData.fixedAmount || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, fixedAmount: parseFloat(e.target.value) || undefined })
                      }
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                )}

                {formData.amountType === 'notional' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Amount (₦)
                      </label>
                      <Input
                        type="number"
                        value={formData.minAmount || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, minAmount: parseFloat(e.target.value) || undefined })
                        }
                        placeholder="Minimum"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Amount (₦)
                      </label>
                      <Input
                        type="number"
                        value={formData.maxAmount || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, maxAmount: parseFloat(e.target.value) || undefined })
                        }
                        placeholder="Maximum"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Contribution Schedule */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Contribution Schedule
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Type *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, contributionType: 'continuous' })}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        formData.contributionType === 'continuous'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900">Continuous</h3>
                      <p className="text-sm text-gray-600">Recurring contributions</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, contributionType: 'period' })}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        formData.contributionType === 'period'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900">Period-based</h3>
                      <p className="text-sm text-gray-600">Specific time periods</p>
                    </button>
                  </div>
                </div>

                {formData.contributionType === 'continuous' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency *
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((freq) => (
                          <button
                            key={freq}
                            type="button"
                            onClick={() => setFormData({ ...formData, frequency: freq })}
                            className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${
                              formData.frequency === freq
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date (Optional)
                        </label>
                        <Input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          min={formData.startDate}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Status */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Activate Plan Immediately</h3>
                  <p className="text-sm text-gray-600">Make this plan available for subscriptions</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                leftIcon={<Save className="w-4 h-4" />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Contribution Plan'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
