import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, Input, useToast } from '../components/ui'
import { ArrowLeft, HandCoins, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react'
import { loanApi, type LoanType, type RequestLoanDto } from '../api/loanApi'

export const LoanRequestPage: React.FC = () => {
  const { cooperativeId } = useParams<{ cooperativeId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [loanTypes, setLoanTypes] = useState<LoanType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<RequestLoanDto>({
    loanTypeId: '',
    amount: 0,
    purpose: '',
    duration: 6,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadLoanTypes()
  }, [cooperativeId])

  const loadLoanTypes = async () => {
    try {
      setIsLoading(true)
      const response = await loanApi.getLoanTypes(cooperativeId!)
      if (response.success) {
        const activeTypes = response.data.filter((lt) => lt.isActive)
        setLoanTypes(activeTypes)
        if (activeTypes.length > 0) {
          setFormData((prev) => ({ ...prev, loanTypeId: activeTypes[0].id }))
        }
      }
    } catch (error: any) {
      toast.error('Failed to load loan types')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedLoanType = useMemo(() => {
    return loanTypes.find((lt) => lt.id === formData.loanTypeId)
  }, [loanTypes, formData.loanTypeId])

  const calculatedRepayment = useMemo(() => {
    if (!selectedLoanType || !formData.amount || !formData.duration) return null

    const principal = formData.amount
    const monthlyRate = selectedLoanType.interestRate / 100 / 12
    const months = formData.duration

    // Calculate total interest
    const totalInterest = principal * (selectedLoanType.interestRate / 100) * (months / 12)
    const totalRepayable = principal + totalInterest
    const monthlyPayment = totalRepayable / months

    return {
      principal,
      totalInterest,
      totalRepayable,
      monthlyPayment,
    }
  }, [selectedLoanType, formData.amount, formData.duration])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.loanTypeId) {
      newErrors.loanTypeId = 'Please select a loan type'
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount is required'
    } else if (selectedLoanType) {
      if (formData.amount < selectedLoanType.minAmount) {
        newErrors.amount = `Minimum amount is ₦${selectedLoanType.minAmount.toLocaleString()}`
      } else if (formData.amount > selectedLoanType.maxAmount) {
        newErrors.amount = `Maximum amount is ₦${selectedLoanType.maxAmount.toLocaleString()}`
      }
    }

    if (!formData.purpose || formData.purpose.length < 10) {
      newErrors.purpose = 'Purpose must be at least 10 characters'
    }

    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = 'Duration is required'
    } else if (selectedLoanType) {
      if (formData.duration < selectedLoanType.minDuration) {
        newErrors.duration = `Minimum duration is ${selectedLoanType.minDuration} months`
      } else if (formData.duration > selectedLoanType.maxDuration) {
        newErrors.duration = `Maximum duration is ${selectedLoanType.maxDuration} months`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await loanApi.requestLoan(cooperativeId!, formData)
      if (response.success) {
        toast.success('Loan request submitted successfully!')
        navigate(`/cooperatives/${cooperativeId}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit loan request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading loan types...</p>
        </div>
      </div>
    )
  }

  if (loanTypes.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/cooperatives/${cooperativeId}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-6"
          >
            Back
          </Button>
          <Card className="p-8 text-center">
            <HandCoins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Loan Types Available</h2>
            <p className="text-gray-600">
              Your cooperative hasn't set up any loan types yet. Please contact an administrator.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/cooperatives/${cooperativeId}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back
          </Button>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-xl">
              <HandCoins className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Request a Loan</h1>
              <p className="text-gray-600">Apply for a cooperative loan</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Loan Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loan Type
                  </label>
                  <div className="space-y-3">
                    {loanTypes.map((loanType) => (
                      <button
                        key={loanType.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, loanTypeId: loanType.id }))
                        }
                        className={`
                          w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
                          ${
                            formData.loanTypeId === loanType.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{loanType.name}</h4>
                            {loanType.description && (
                              <p className="text-sm text-gray-600 mt-1">{loanType.description}</p>
                            )}
                            <div className="flex flex-wrap gap-4 mt-3 text-sm">
                              <span className="text-gray-600">
                                Rate: <span className="font-semibold">{loanType.interestRate}%</span>
                              </span>
                              <span className="text-gray-600">
                                Amount: <span className="font-semibold">
                                  ₦{loanType.minAmount.toLocaleString()} - ₦
                                  {loanType.maxAmount.toLocaleString()}
                                </span>
                              </span>
                              <span className="text-gray-600">
                                Duration: <span className="font-semibold">
                                  {loanType.minDuration}-{loanType.maxDuration} months
                                </span>
                              </span>
                            </div>
                          </div>
                          {formData.loanTypeId === loanType.id && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.loanTypeId && (
                    <p className="text-sm text-red-600 mt-1">{errors.loanTypeId}</p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <Input
                    label="Loan Amount (₦)"
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                    }
                    error={errors.amount}
                    icon={<DollarSign className="w-5 h-5" />}
                    placeholder="Enter amount"
                  />
                  {selectedLoanType && (
                    <p className="text-xs text-gray-500 mt-1">
                      Range: ₦{selectedLoanType.minAmount.toLocaleString()} - ₦
                      {selectedLoanType.maxAmount.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <Input
                    label="Duration (Months)"
                    type="number"
                    value={formData.duration || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: parseInt(e.target.value) || 0,
                      }))
                    }
                    error={errors.duration}
                    icon={<Calendar className="w-5 h-5" />}
                    placeholder="Enter duration"
                  />
                  {selectedLoanType && (
                    <p className="text-xs text-gray-500 mt-1">
                      Range: {selectedLoanType.minDuration} - {selectedLoanType.maxDuration} months
                    </p>
                  )}
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purpose of Loan
                  </label>
                  <div className="relative">
                    <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <textarea
                      value={formData.purpose}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, purpose: e.target.value }))
                      }
                      placeholder="Explain why you need this loan..."
                      className={`
                        w-full pl-11 pr-4 py-3 bg-white border-2 rounded-xl text-gray-900 
                        placeholder:text-gray-400 focus:outline-none transition-all duration-300
                        min-h-[120px] resize-y
                        ${
                          errors.purpose
                            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                        }
                      `}
                    />
                  </div>
                  {errors.purpose && <p className="text-sm text-red-600 mt-1">{errors.purpose}</p>}
                  <p className="text-xs text-gray-500 mt-1">{formData.purpose.length} characters</p>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => navigate(`/cooperatives/${cooperativeId}`)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Loan Summary</h3>

              {calculatedRepayment ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Principal Amount</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₦{calculatedRepayment.principal.toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Interest Rate</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedLoanType?.interestRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formData.duration} months
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Interest</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ₦{calculatedRepayment.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between">
                      <span className="text-sm font-semibold text-gray-900">Total Repayable</span>
                      <span className="text-lg font-bold text-gray-900">
                        ₦{calculatedRepayment.totalRepayable.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Monthly Payment</p>
                      <p className="text-xl font-bold text-green-600">
                        ₦{calculatedRepayment.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {selectedLoanType?.requiresGuarantor && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-orange-900">Guarantor Required</p>
                        <p className="text-xs text-orange-700 mt-1">
                          This loan type requires a guarantor to approve your request
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Fill in the form to see loan summary
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
