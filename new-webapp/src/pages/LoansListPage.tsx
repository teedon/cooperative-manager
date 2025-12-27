import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../hooks/useAuth'
import { Button, Card, useToast } from '../components/ui'
import {
  ArrowLeft,
  HandCoins,
  Plus,
  Filter,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Ban,
} from 'lucide-react'
import { loanApi, type Loan } from '../api/loanApi'

type LoanStatus = 'all' | 'pending' | 'approved' | 'disbursed' | 'repaying' | 'completed' | 'rejected' | 'defaulted'

export const LoansListPage: React.FC = () => {
  const { cooperativeId } = useParams<{ cooperativeId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAppSelector((state) => state.auth)

  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LoanStatus>('all')
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all')

  useEffect(() => {
    loadLoans()
  }, [cooperativeId, viewMode])

  const loadLoans = async () => {
    try {
      setIsLoading(true)
      const response = viewMode === 'my' 
        ? await loanApi.getMyLoans(cooperativeId!)
        : await loanApi.getLoans(cooperativeId!)
      
      if (response.success) {
        setLoans(response.data)
      }
    } catch (error: any) {
      toast.error('Failed to load loans')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesSearch =
        loan.member?.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.member?.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.member?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.member?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.purpose?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || loan.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [loans, searchQuery, statusFilter])

  const stats = useMemo(() => {
    return {
      total: loans.length,
      pending: loans.filter((l) => l.status === 'pending').length,
      active: loans.filter((l) => ['disbursed', 'repaying'].includes(l.status)).length,
      completed: loans.filter((l) => l.status === 'completed').length,
      totalAmount: loans.reduce((sum, l) => sum + l.amount, 0),
      totalRepaid: loans.reduce((sum, l) => sum + l.amountPaid, 0),
    }
  }, [loans])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-blue-100 text-blue-800 border-blue-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      disbursed: 'bg-green-100 text-green-800 border-green-300',
      repaying: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      defaulted: 'bg-gray-100 text-gray-800 border-gray-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle2 className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      disbursed: <TrendingUp className="w-4 h-4" />,
      repaying: <TrendingUp className="w-4 h-4" />,
      completed: <CheckCircle2 className="w-4 h-4" />,
      defaulted: <Ban className="w-4 h-4" />,
    }
    return icons[status] || <AlertCircle className="w-4 h-4" />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading loans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-100 rounded-xl">
                <HandCoins className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Loans</h1>
                <p className="text-gray-600">Manage cooperative loans</p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate(`/cooperatives/${cooperativeId}/loans/request`)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Request Loan
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Loans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <HandCoins className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('all')}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all duration-300
                  ${
                    viewMode === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                All Loans
              </button>
              <button
                onClick={() => setViewMode('my')}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all duration-300
                  ${
                    viewMode === 'my'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                My Loans
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by member or purpose..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LoanStatus)}
                className="pl-11 pr-8 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="disbursed">Disbursed</option>
                <option value="repaying">Repaying</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="defaulted">Defaulted</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Loans List */}
        <Card className="p-6">
          {filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <HandCoins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No loans found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Request a loan to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/cooperatives/${cooperativeId}/loans/request`)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Request Loan
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLoans.map((loan) => (
                <div
                  key={loan.id}
                  onClick={() => navigate(`/cooperatives/${cooperativeId}/loans/${loan.id}`)}
                  className="p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-500"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">
                          {loan.member?.user?.firstName || loan.member?.firstName}{' '}
                          {loan.member?.user?.lastName || loan.member?.lastName}
                        </h4>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(loan.status)}`}
                        >
                          {getStatusIcon(loan.status)}
                          {loan.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{loan.purpose}</p>
                      {loan.loanType && (
                        <p className="text-xs text-gray-500">{loan.loanType.name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ₦{loan.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{loan.duration} months</p>
                    </div>
                  </div>

                  {['disbursed', 'repaying', 'completed'].includes(loan.status) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Repayment Progress</span>
                        <span className="font-semibold text-gray-900">
                          {Math.round((loan.amountPaid / loan.totalRepayable) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(loan.amountPaid / loan.totalRepayable) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                        <span>Paid: ₦{loan.amountPaid.toLocaleString()}</span>
                        <span>Remaining: ₦{loan.amountRemaining.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Requested:{' '}
                      {new Date(loan.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {loan.nextPaymentDate && (
                      <span>
                        Next Payment:{' '}
                        {new Date(loan.nextPaymentDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
