import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, DollarSign, CheckCircle2, Clock, Tag } from 'lucide-react'
import { Button, Card, useToast } from '../components/ui'
import { feeApi, type CooperativeFee } from '../api/feeApi'

export const FeesPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [fees, setFees] = useState<CooperativeFee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    if (id) loadData()
  }, [id])

  const loadData = async () => {
    if (!id) return
    try {
      setIsLoading(true)
      const res = await feeApi.getFees(id)
      if (res.success) setFees(res.data)
    } catch {
      toast.error('Failed to load fees')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredFees = fees.filter((fee) => {
    if (filter === 'active') return fee.isActive
    if (filter === 'inactive') return !fee.isActive
    return true
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/cooperatives/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Fees</h1>
            <p className="text-gray-500 text-sm">Registration fees, ID card fees, and more</p>
          </div>
          <Button
            onClick={() => navigate(`/cooperatives/${id}/fees/create`)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Fee
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Tag className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Fees</p>
                <p className="text-xl font-bold text-gray-900">{fees.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-xl font-bold text-gray-900">{fees.filter((f) => f.isActive).length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">My Total Paid</p>
                <p className="text-xl font-bold text-gray-900">
                  ₦{fees.reduce((sum, f) => sum + (f.myPaid || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'active', 'inactive'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Fee List */}
        {filteredFees.length === 0 ? (
          <Card className="p-12 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No fees found</h3>
            <p className="text-gray-500 mb-4">Create your first fee template to get started</p>
            <Button onClick={() => navigate(`/cooperatives/${id}/fees/create`)}>
              Create Fee
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFees.map((fee) => (
              <div
                key={fee.id}
                className="p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/cooperatives/${id}/fees/${fee.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{fee.name}</h3>
                    {fee.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{fee.description}</p>
                    )}
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      fee.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {fee.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-amber-600">
                      ₦{fee.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {fee.myPaid !== undefined && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">My payments</span>
                      <span className="font-medium text-gray-900">
                        ₦{(fee.myPaid || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, ((fee.myPaid || 0) / fee.amount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(fee.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
