import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Edit,
} from 'lucide-react'
import { Button, Card, useToast } from '../components/ui'
import { feeApi, type CooperativeFee, type CooperativeFeePayment, type RecordFeePaymentDto } from '../api/feeApi'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'card', label: 'Card' },
]

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export const FeePaymentsPage = () => {
  const { id, feeId } = useParams<{ id: string; feeId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [fee, setFee] = useState<CooperativeFee | null>(null)
  const [payments, setPayments] = useState<CooperativeFeePayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const [paymentForm, setPaymentForm] = useState<RecordFeePaymentDto>({
    amount: 0,
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
  })

  const [approvalModal, setApprovalModal] = useState<{
    payment: CooperativeFeePayment
    action: 'approve' | 'reject'
  } | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isApproving, setIsApproving] = useState(false)

  useEffect(() => {
    if (id && feeId) loadData()
  }, [id, feeId])

  const loadData = async () => {
    if (!id || !feeId) return
    try {
      setIsLoading(true)
      const [feesRes, paymentsRes] = await Promise.all([
        feeApi.getFees(id),
        feeApi.getFeePayments(feeId),
      ])
      if (feesRes.success) {
        const found = feesRes.data.find((f: CooperativeFee) => f.id === feeId)
        if (found) setFee(found)
      }
      if (paymentsRes.success) {
        setPayments(paymentsRes.data)
      }
    } catch {
      toast.error('Failed to load fee payments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feeId) return
    if (!paymentForm.amount || paymentForm.amount < 1) {
      toast.error('Amount must be at least ₦1')
      return
    }
    try {
      setIsSubmitting(true)
      const res = await feeApi.recordFeePayment(feeId, paymentForm)
      if (res.success) {
        toast.success('Payment recorded successfully')
        setShowPaymentForm(false)
        setPaymentForm({ amount: 0, paymentMethod: 'cash', paymentDate: new Date().toISOString().split('T')[0] })
        loadData()
      } else {
        toast.error(res.message || 'Failed to record payment')
      }
    } catch {
      toast.error('Failed to record payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    if (!approvalModal) return
    try {
      setIsApproving(true)
      const res = await feeApi.approveFeePayment(approvalModal.payment.id, {
        status: approvalModal.action === 'approve' ? 'approved' : 'rejected',
        rejectionReason: approvalModal.action === 'reject' ? rejectionReason : undefined,
      })
      if (res.success) {
        toast.success(`Payment ${approvalModal.action === 'approve' ? 'approved' : 'rejected'} successfully`)
        setApprovalModal(null)
        setRejectionReason('')
        loadData()
      } else {
        toast.error(res.message || 'Failed to process approval')
      }
    } catch {
      toast.error('Failed to process approval')
    } finally {
      setIsApproving(false)
    }
  }

  const filteredPayments = payments.filter((p) =>
    statusFilter === 'all' ? true : p.status === statusFilter
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/cooperatives/${id}/fees`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{fee?.name || 'Fee Payments'}</h1>
            {fee?.description && <p className="text-gray-500 text-sm">{fee.description}</p>}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate(`/cooperatives/${id}/fees/${feeId}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Fee
            </Button>
            <Button
              onClick={() => setShowPaymentForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Fee amount card */}
        {fee && (
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fee Amount</p>
                <p className="text-xl font-bold text-gray-900">₦{fee.amount.toLocaleString()}</p>
              </div>
              <div className="ml-8">
                <p className="text-sm text-gray-500">Total Payments</p>
                <p className="text-xl font-bold text-gray-900">{payments.length}</p>
              </div>
              <div className="ml-8">
                <p className="text-sm text-gray-500">Pending Approval</p>
                <p className="text-xl font-bold text-yellow-600">
                  {payments.filter((p) => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Record Payment Form */}
        {showPaymentForm && (
          <Card className="p-5 mb-6 border-2 border-amber-200 bg-amber-50">
            <h3 className="font-semibold text-gray-900 mb-4">Record Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₦) *
                  </label>
                  <input
                    type="number"
                    value={paymentForm.amount || ''}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, amount: parseInt(e.target.value) || 0 }))
                    }
                    min={1}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        paymentMethod: e.target.value as RecordFeePaymentDto['paymentMethod'],
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Reference <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={paymentForm.paymentReference || ''}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, paymentReference: e.target.value }))
                    }
                    placeholder="Receipt or transaction reference"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={paymentForm.notes || ''}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPaymentForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <Card className="p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No payments found</h3>
            <p className="text-gray-500">No payments match the selected filter</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <Card key={payment.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">
                        ₦{payment.amount.toLocaleString()}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[payment.status]}`}
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </div>
                    {payment.member && (
                      <p className="text-sm text-gray-600">
                        {payment.member.user.firstName} {payment.member.user.lastName}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {payment.paymentDate && (
                        <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
                      )}
                      {payment.paymentMethod && (
                        <span className="capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
                      )}
                      {payment.paymentReference && <span>Ref: {payment.paymentReference}</span>}
                    </div>
                    {payment.rejectionReason && (
                      <p className="text-xs text-red-500 mt-1">Reason: {payment.rejectionReason}</p>
                    )}
                  </div>

                  {payment.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setApprovalModal({ payment, action: 'approve' })}
                        className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={() => setApprovalModal({ payment, action: 'reject' })}
                        className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Approval/Rejection Modal */}
      {approvalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {approvalModal.action === 'approve' ? 'Approve Payment' : 'Reject Payment'}
            </h3>
            <p className="text-gray-600 mb-4">
              {approvalModal.action === 'approve'
                ? `Approve payment of ₦${approvalModal.payment.amount.toLocaleString()}?`
                : 'Please provide a reason for rejecting this payment.'}
            </p>

            {approvalModal.action === 'reject' && (
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
              />
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setApprovalModal(null)
                  setRejectionReason('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving || (approvalModal.action === 'reject' && !rejectionReason.trim())}
                className={`flex-1 ${approvalModal.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                {isApproving
                  ? 'Processing...'
                  : approvalModal.action === 'approve'
                  ? 'Approve'
                  : 'Reject'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
