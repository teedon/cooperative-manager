import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Receipt,
  Plus,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import { Button, useToast } from '../components/ui'
import { expenseApi, type Expense, type ExpenseCategory, type ExpenseSummary } from '../api/expenseApi'

export default function ExpensesListPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id, selectedStatus, selectedCategory])

  const loadData = async () => {
    if (!id) return

    try {
      const [expensesRes, categoriesRes, summaryRes] = await Promise.all([
        expenseApi.getExpenses(id, {
          status: selectedStatus,
          categoryId: selectedCategory,
        }),
        expenseApi.getCategories(id),
        expenseApi.getExpenseSummary(id),
      ])

      if (expensesRes.success) setExpenses(expensesRes.data || [])
      if (categoriesRes.success) setCategories(categoriesRes.data || [])
      if (summaryRes.success) setSummary(summaryRes.data)
    } catch (error: any) {
      console.error('Error loading expenses:', error)
      toast.error(error.response?.data?.message || 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/cooperatives/${id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
                <p className="text-sm text-gray-600">Track and manage expenses</p>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/cooperatives/${id}/expenses/create`)}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Record Expense
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Approved</p>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₦{summary.totalApprovedAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">{summary.totalApprovedCount} expenses</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Pending Approval</p>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₦{summary.totalPendingAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">{summary.totalPendingCount} expenses</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Top Category</p>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Receipt className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              {summary.expensesByCategory.length > 0 ? (
                <>
                  <p className="text-lg font-bold text-gray-900">
                    {summary.expensesByCategory[0].categoryName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ₦{summary.expensesByCategory[0].totalAmount.toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="text-lg text-gray-400">No expenses</p>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">This Month</p>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              {summary.monthlyTrend.length > 0 ? (
                <>
                  <p className="text-2xl font-bold text-gray-900">
                    ₦{summary.monthlyTrend[summary.monthlyTrend.length - 1].amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(summary.monthlyTrend[summary.monthlyTrend.length - 1].month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </>
              ) : (
                <p className="text-2xl text-gray-400">₦0</p>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>

          {/* Status Filter */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status === 'all' ? undefined : status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    (status === 'all' && !selectedStatus) || selectedStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(undefined)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !selectedCategory
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      selectedCategory === category.id
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === category.id ? category.color : undefined,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: selectedCategory === category.id ? 'white' : category.color }}
                    />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expenses List */}
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Expenses Found</h3>
              <p className="text-gray-600 mb-6">
                {selectedStatus || selectedCategory
                  ? 'No expenses match your filters'
                  : 'Record your first expense to get started'}
              </p>
              {!selectedStatus && !selectedCategory && (
                <Button onClick={() => navigate(`/cooperatives/${id}/expenses/create`)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Record Expense
                </Button>
              )}
            </div>
          ) : (
            expenses.map((expense) => {
              const statusConfig = getStatusConfig(expense.status)
              const StatusIcon = statusConfig.icon

              return (
                <div
                  key={expense.id}
                  onClick={() => navigate(`/cooperatives/${id}/expenses/${expense.id}`)}
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  {expense.category && (
                    <div className="h-1" style={{ backgroundColor: expense.category.color }} />
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{expense.title}</h3>
                        {expense.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{expense.description}</p>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900 ml-4">
                        ₦{expense.amount.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {expense.category && (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: expense.category.color }}
                            />
                            <span>{expense.category.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(expense.expenseDate)}</span>
                        </div>
                        {expense.createdByUser && (
                          <div className="flex items-center gap-1.5">
                            <span>
                              by {expense.createdByUser.firstName} {expense.createdByUser.lastName}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusConfig.bg}`}>
                        <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                        <span className={`text-xs font-semibold ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
