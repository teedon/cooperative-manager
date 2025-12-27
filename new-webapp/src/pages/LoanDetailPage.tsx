import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../hooks/useAuth'
import { Button, Card, Input, useToast } from '../components/ui'
import {
  ArrowLeft,
  HandCoins,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { loanApi, type Loan, type RepaymentSchedule } from '../api/loanApi'

export const LoanDetailPage: React.FC = () => {
  const { cooperativeId, loanId } = useParams<{ cooperativeId: string; loanId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAppSelector((state) => state.auth)

  const [loan, setLoan] = useState<Loan | null>(null)
  const [repaymentSchedule, setRepaymentSchedule] = useState<RepaymentSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showRepaymentModal, setShowRepaymentModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [repaymentData, setRepaymentData] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    notes: '',
  })

  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    loadLoanData()
  }, [loanId])

  const loadLoanData = async () => {
    try {
      setIsLoading(true)
      const [loanResponse, scheduleResponse] = await Promise.all([
        loanApi.getLoan(loanId!),
        loanApi.getRepaymentSchedule(loanId!),
      ])

      if (loanResponse.success) {
        setLoan(loanResponse.data)
      }

      if (scheduleResponse.success) {
        setRepaymentSchedule(scheduleResponse.data)
      }
    } catch (error: any) {
      toast.error('Failed to load loan details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveLoan = async () => {
    try {
      setIsSubmitting(true)
      const response = await loanApi.approveLoan(loanId!)
      if (response.success) {
        toast.success('Loan approved successfully')
        loadLoanData()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve loan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectLoan = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await loanApi.rejectLoan(loanId!, rejectionReason)
      if (response.success) {
        toast.success('Loan rejected')
        setShowRejectModal(false)
        setRejectionReason('')
        loadLoanData()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject loan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDisburseLoan = async () => {
    try {
      setIsSubmitting(true)
      const response = await loanApi.disburseLoan(loanId!)
      if (response.success) {
        toast.success('Loan disbursed successfully')
        loadLoanData()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to disburse loan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRecordRepayment = async () => {
    if (!repaymentData.amount || parseFloat(repaymentData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await loanApi.recordRepayment(loanId!, {
        amount: parseFloat(repaymentData.amount),
        paymentMethod: repaymentData.paymentMethod,
        paymentReference: repaymentData.paymentReference || undefined,
        notes: repaymentData.notes || undefined,
      })

      if (response.success) {
        toast.success('Repayment recorded successfully')
        setShowRepaymentModal(false)
        setRepaymentData({
          amount: '',
          paymentMethod: 'bank_transfer',
          paymentReference: '',
          notes: '',
        })
        loadLoanData()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record repayment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openRepaymentModal = () => {
    const nextPayment = repaymentSchedule.find(
      (r) => r.status === 'pending' || r.status === 'overdue'
    )
    if (nextPayment) {
      const remaining = nextPayment.totalAmount - (nextPayment.paidAmount || 0)
      setRepaymentData((prev) => ({ ...prev, amount: remaining.toString() }))
    }
    setShowRepaymentModal(true)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-blue-100 text-blue-800 border-blue-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      disbursed: 'bg-green-100 text-green-800 border-green-300',
      repaying: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      defaulted: 'bg-gray-100 text-gray-800 border-gray-300',
      paid: 'bg-green-100 text-green-800 border-green-300',
      partial: 'bg-orange-100 text-orange-800 border-orange-300',
      overdue: 'bg-red-100 text-red-800 border-red-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading loan details...</p>
        </div>
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loan Not Found</h2>
          <p className="text-gray-600 mb-6">The loan you're looking for doesn't exist.</p>
          <Button variant="primary" onClick={() => navigate(`/cooperatives/${cooperativeId}`)}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  const isLoanOwner = loan.member?.userId === user?.id
  const canRecordRepayment = ['disbursed', 'repaying'].includes(loan.status)
  const canApprove = loan.status === 'pending'
  const canDisburse = loan.status === 'approved'

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/cooperatives/${cooperativeId}/loans`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back to Loans
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loan Info Card */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">Loan Details</h1>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(loan.status)}`}
                    >
                      {loan.status}
                    </span>
                  </div>
                  <p className="text-gray-600">{loan.loanType?.name}</p>
                </div>
                <div className="p-4 bg-purple-100 rounded-xl">
                  <HandCoins className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Loan Amount</p>
                  <p className="text-3xl font-bold text-gray-900">₦{loan.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Monthly Payment</p>
                  <p className="text-3xl font-bold text-green-600">
                    ₦{loan.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Duration</p>
                  <p className="text-lg font-semibold text-blue-900">{loan.duration} months</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Interest Rate</p>
                  <p className="text-lg font-semibold text-purple-900">{loan.interestRate}%</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Repayable</p>
                  <p className="text-lg font-semibold text-indigo-900">
                    ₦{loan.totalRepayable.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Amount Paid</p>
                  <p className="text-lg font-semibold text-green-900">
                    ₦{loan.amountPaid.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Borrower Info */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Borrower Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name</span>
                  <span className="font-semibold text-gray-900">
                    {loan.member?.user?.firstName || loan.member?.firstName}{' '}
                    {loan.member?.user?.lastName || loan.member?.lastName}
                  </span>
                </div>
                {loan.member?.user?.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-semibold text-gray-900">{loan.member.user.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Request Date</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(loan.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </Card>

            {/* Purpose */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Purpose
              </h3>
              <p className="text-gray-700">{loan.purpose}</p>
            </Card>

            {/* Rejection Reason */}
            {loan.status === 'rejected' && loan.rejectionReason && (
              <Card className="p-6 bg-red-50 border-2 border-red-200">
                <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Rejection Reason
                </h3>
                <p className="text-red-700">{loan.rejectionReason}</p>
              </Card>
            )}

            {/* Repayment Schedule */}
            {repaymentSchedule.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Repayment Schedule</h3>
                <div className="space-y-3">
                  {repaymentSchedule.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">
                          Payment #{schedule.scheduleNumber}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(schedule.status)}`}
                        >
                          {schedule.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Due Date</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(schedule.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-semibold text-gray-900">
                            ₦{schedule.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        {schedule.paidAmount > 0 && (
                          <>
                            <div>
                              <p className="text-gray-600">Paid</p>
                              <p className="font-semibold text-green-600">
                                ₦{schedule.paidAmount.toLocaleString()}
                              </p>
                            </div>
                            {schedule.paidAt && (
                              <div>
                                <p className="text-gray-600">Paid On</p>
                                <p className="font-semibold text-gray-900">
                                  {new Date(schedule.paidAt).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Actions */}
            <Card className="p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {canApprove && (
                  <>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleApproveLoan}
                      loading={isSubmitting}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Approve Loan
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => setShowRejectModal(true)}
                      leftIcon={<XCircle className="w-4 h-4" />}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Reject Loan
                    </Button>
                  </>
                )}

                {canDisburse && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleDisburseLoan}
                    loading={isSubmitting}
                    leftIcon={<TrendingUp className="w-4 h-4" />}
                  >
                    Disburse Loan
                  </Button>
                )}

                {canRecordRepayment && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={openRepaymentModal}
                    leftIcon={<CreditCard className="w-4 h-4" />}
                  >
                    Record Repayment
                  </Button>
                )}
              </div>
            </Card>

            {/* Progress Card */}
            {['disbursed', 'repaying', 'completed'].includes(loan.status) && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Repayment Progress</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600">
                      {Math.round((loan.amountPaid / loan.totalRepayable) * 100)}%
                    </p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(loan.amountPaid / loan.totalRepayable) * 100}%` }}
                    ></div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid</span>
                      <span className="font-semibold text-gray-900">
                        ₦{loan.amountPaid.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining</span>
                      <span className="font-semibold text-gray-900">
                        ₦{loan.amountRemaining.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Repayment Modal */}
      {showRepaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Record Repayment</h3>
            <div className="space-y-4">
              <Input
                label="Amount (₦)"
                type="number"
                value={repaymentData.amount}
                onChange={(e) =>
                  setRepaymentData((prev) => ({ ...prev, amount: e.target.value }))
                }
                icon={<DollarSign className="w-5 h-5" />}
                placeholder="Enter amount"
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={repaymentData.paymentMethod}
                  onChange={(e) =>
                    setRepaymentData((prev) => ({ ...prev, paymentMethod: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="check">Check</option>
                </select>
              </div>

              <Input
                label="Payment Reference (Optional)"
                type="text"
                value={repaymentData.paymentReference}
                onChange={(e) =>
                  setRepaymentData((prev) => ({ ...prev, paymentReference: e.target.value }))
                }
                placeholder="Transaction reference"
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={repaymentData.notes}
                  onChange={(e) =>
                    setRepaymentData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Additional notes..."
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 min-h-[80px] resize-y"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowRepaymentModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleRecordRepayment}
                  loading={isSubmitting}
                >
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Reject Loan</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this loan.</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 min-h-[120px] resize-y mb-4"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleRejectLoan}
                loading={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? 'Rejecting...' : 'Reject Loan'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
