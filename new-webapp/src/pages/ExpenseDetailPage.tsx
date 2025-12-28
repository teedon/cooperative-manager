import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Calendar,
  User,
  Building,
  Phone,
  Receipt,
  CreditCard,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
} from 'lucide-react'
import { Button, useToast } from '../components/ui'
import { expenseApi, type Expense } from '../api/expenseApi'

export default function ExpenseDetailPage() {
  const { id, expenseId } = useParams<{ id: string; expenseId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    if (id && expenseId) {
      loadExpense()
    }
  }, [id, expenseId])

  const loadExpense = async () => {
    if (!id || !expenseId) return

    try {
      const response = await expenseApi.getExpense(id, expenseId)
      if (response.success) {
        setExpense(response.data)
      }
    } catch (error: any) {
      console.error('Error loading expense:', error)
      toast.error(error.response?.data?.message || 'Failed to load expense')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!id || !expenseId) return

    setApproving(true)
    try {
      const response = await expenseApi.approveExpense(id, expenseId, { status: 'approved' })
      if (response.success) {
        toast.success('Expense approved successfully')
        setExpense(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve expense')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    if (!id || !expenseId || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setApproving(true)
    try {
      const response = await expenseApi.approveExpense(id, expenseId, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
      })
      if (response.success) {
        toast.success('Expense rejected')
        setExpense(response.data)
        setShowRejectModal(false)
        setRejectionReason('')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject expense')
    } finally {
      setApproving(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !expenseId) return

    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return
    }

    try {
      const response = await expenseApi.deleteExpense(id, expenseId)
      if (response.success) {
        toast.success('Expense deleted successfully')
        navigate(`/cooperatives/${id}/expenses`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete expense')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Receipt className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Expense Not Found</h2>
        <Button onClick={() => navigate(`/cooperatives/${id}/expenses`)}>Back to Expenses</Button>
      </div>
    )
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2, label: 'Approved' }
      case 'rejected':
        return { color: 'text-red-700', bg: 'bg-red-100', icon: XCircle, label: 'Rejected' }
      case 'pending':
      default:
        return { color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock, label: 'Pending' }
    }
  }

  const statusConfig = getStatusConfig(expense.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate(`/cooperatives/${id}/expenses`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>Back to Expenses</span>
            </button>
            <div className="flex items-center gap-2">
              {expense.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/cooperatives/${id}/expenses/${expenseId}/edit`)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg}`}>
              <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
              <span className={`text-sm font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
            </div>
            {expense.category && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: expense.category.color + '20', color: expense.category.color }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: expense.category.color }} />
                <span className="text-sm font-medium">{expense.category.name}</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">{expense.title}</h1>
          <p className="text-4xl font-bold text-blue-600 mb-4">₦{expense.amount.toLocaleString()}</p>

          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span>
              {new Date(expense.expenseDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Description */}
        {expense.description && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-900">{expense.description}</p>
          </div>
        )}

        {/* Vendor Details */}
        {(expense.vendorName || expense.vendorContact) && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Vendor Details</h3>
            <div className="space-y-3">
              {expense.vendorName && (
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{expense.vendorName}</span>
                </div>
              )}
              {expense.vendorContact && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{expense.vendorContact}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Details */}
        {(expense.paymentMethod || expense.paymentReference || expense.receiptNumber) && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Details</h3>
            <div className="space-y-3">
              {expense.paymentMethod && (
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 capitalize">{expense.paymentMethod.replace('_', ' ')}</span>
                </div>
              )}
              {expense.paymentReference && (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{expense.paymentReference}</span>
                </div>
              )}
              {expense.receiptNumber && (
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{expense.receiptNumber}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approval Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Approval Information</h3>
          <div className="space-y-3">
            {expense.createdByUser && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">Created by:</span>
                <span className="text-gray-900 font-medium">
                  {expense.createdByUser.firstName} {expense.createdByUser.lastName}
                </span>
              </div>
            )}
            {expense.approvedByUser && (
              <>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">
                    {expense.status === 'approved' ? 'Approved by:' : 'Rejected by:'}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {expense.approvedByUser.firstName} {expense.approvedByUser.lastName}
                  </span>
                </div>
                {expense.approvedAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">
                      {expense.status === 'approved' ? 'Approved on:' : 'Rejected on:'}
                    </span>
                    <span className="text-gray-900">
                      {new Date(expense.approvedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </>
            )}
            {expense.rejectionReason && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-800">{expense.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Approval Actions */}
        {expense.status === 'pending' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Approval Actions</h3>
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                {approving ? 'Approving...' : 'Approve Expense'}
              </Button>
              <Button
                onClick={() => setShowRejectModal(true)}
                disabled={approving}
                variant="outline"
                className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Reject Expense
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Expense</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this expense:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                }}
                className="flex-1"
                disabled={approving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={approving || !rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {approving ? 'Rejecting...' : 'Reject Expense'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
