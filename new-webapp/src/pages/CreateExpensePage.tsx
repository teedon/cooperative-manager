import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Calendar,
  DollarSign,
  FileText,
  Building,
  Phone,
  Receipt,
  Tag,
  Save,
} from 'lucide-react'
import { Button, Input, useToast } from '../components/ui'
import { expenseApi, type ExpenseCategory, type CreateExpenseDto } from '../api/expenseApi'

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'mobile_money', label: 'Mobile Money', icon: '📱' },
]

export default function CreateExpensePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [vendorName, setVendorName] = useState('')
  const [vendorContact, setVendorContact] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>()
  const [paymentReference, setPaymentReference] = useState('')

  useEffect(() => {
    if (id) {
      loadCategories()
    }
  }, [id])

  const loadCategories = async () => {
    if (!id) return

    try {
      const response = await expenseApi.getCategories(id)
      if (response.success) {
        setCategories(response.data || [])
      }
    } catch (error: any) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('Please enter an expense title')
      return false
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !id) return

    setSubmitting(true)
    try {
      const data: CreateExpenseDto = {
        title: title.trim(),
        description: description.trim() || undefined,
        amount: parseFloat(amount),
        expenseDate: new Date(expenseDate).toISOString(),
        categoryId: categoryId || undefined,
        vendorName: vendorName.trim() || undefined,
        vendorContact: vendorContact.trim() || undefined,
        receiptNumber: receiptNumber.trim() || undefined,
        paymentMethod: paymentMethod || undefined,
        paymentReference: paymentReference.trim() || undefined,
      }

      const response = await expenseApi.createExpense(id, data)
      if (response.success) {
        toast.success('Expense recorded successfully')
        navigate(`/cooperatives/${id}/expenses/${response.data.id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record expense')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-4">
            <button
              onClick={() => navigate(`/cooperatives/${id}/expenses`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Record Expense</h1>
              <p className="text-sm text-gray-600">Add a new expense to your cooperative</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Basic Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Details</h3>

          <div className="space-y-4">
            <Input
              label="Expense Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Office supplies purchase"
              icon={<FileText className="w-5 h-5" />}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₦) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expense Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about this expense..."
                rows={3}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category</h3>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(categoryId === category.id ? undefined : category.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                    categoryId === category.id
                      ? 'text-white border-transparent shadow-md'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: categoryId === category.id ? category.color : undefined,
                    borderColor: categoryId === category.id ? category.color : undefined,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: categoryId === category.id ? 'white' : category.color,
                    }}
                  />
                  <span className="font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vendor Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor / Payee</h3>
          <div className="space-y-4">
            <Input
              label="Vendor Name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g., ABC Supplies Ltd"
              icon={<Building className="w-5 h-5" />}
            />

            <Input
              label="Contact (Phone/Email)"
              value={vendorContact}
              onChange={(e) => setVendorContact(e.target.value)}
              placeholder="e.g., 08012345678"
              icon={<Phone className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(paymentMethod === method.id ? undefined : method.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === method.id
                        ? 'bg-blue-50 border-blue-600 text-blue-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <span className="text-sm font-medium text-center">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Payment Reference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g., TRX123456789"
              icon={<Tag className="w-5 h-5" />}
            />

            <Input
              label="Receipt Number"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="e.g., RCP-2025-001"
              icon={<Receipt className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/cooperatives/${id}/expenses`)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="flex-1">
            <Save className="w-5 h-5 mr-2" />
            {submitting ? 'Recording...' : 'Record Expense'}
          </Button>
        </div>
      </form>
    </div>
  )
}
