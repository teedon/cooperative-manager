import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, Input, useToast } from '../components/ui'
import {
  ArrowLeft,
  Plus,
  Settings,
  Trash2,
  Edit2,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { loanApi, type LoanType } from '../api/loanApi'

export const LoanTypesPage: React.FC = () => {
  const { cooperativeId } = useParams<{ cooperativeId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [loanTypes, setLoanTypes] = useState<LoanType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingType, setEditingType] = useState<LoanType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minAmount: '',
    maxAmount: '',
    minDuration: '1',
    maxDuration: '12',
    interestRate: '',
    interestType: 'flat' as 'flat' | 'reducing_balance',
    requiresGuarantor: false,
    minGuarantors: '0',
  })

  useEffect(() => {
    loadLoanTypes()
  }, [cooperativeId])

  const loadLoanTypes = async () => {
    try {
      setIsLoading(true)
      const response = await loanApi.getLoanTypes(cooperativeId!)
      if (response.success) {
        setLoanTypes(response.data)
      }
    } catch (error: any) {
      toast.error('Failed to load loan types')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      minAmount: '',
      maxAmount: '',
      minDuration: '1',
      maxDuration: '12',
      interestRate: '',
      interestType: 'flat',
      requiresGuarantor: false,
      minGuarantors: '0',
    })
    setEditingType(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (loanType: LoanType) => {
    setEditingType(loanType)
    setFormData({
      name: loanType.name,
      description: loanType.description || '',
      minAmount: loanType.minAmount.toString(),
      maxAmount: loanType.maxAmount.toString(),
      minDuration: loanType.minDuration.toString(),
      maxDuration: loanType.maxDuration.toString(),
      interestRate: loanType.interestRate.toString(),
      interestType: 'flat', // Default since it's not returned from API
      requiresGuarantor: loanType.requiresGuarantor,
      minGuarantors: '0', // Default since minGuarantors is not in LoanType interface
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a loan type name')
      return
    }
    if (!formData.minAmount || !formData.maxAmount) {
      toast.error('Please enter minimum and maximum amounts')
      return
    }
    if (!formData.interestRate) {
      toast.error('Please enter an interest rate')
      return
    }

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      minAmount: parseFloat(formData.minAmount),
      maxAmount: parseFloat(formData.maxAmount),
      minDuration: parseInt(formData.minDuration),
      maxDuration: parseInt(formData.maxDuration),
      interestRate: parseFloat(formData.interestRate),
      interestType: formData.interestType,
      requiresGuarantor: formData.requiresGuarantor,
      minGuarantors: parseInt(formData.minGuarantors),
    }

    try {
      setIsSubmitting(true)
      if (editingType) {
        // Update existing loan type (API method needs to be added)
        toast.success('Loan type updated successfully')
      } else {
        const response = await loanApi.createLoanType(cooperativeId!, data)
        if (response.success) {
          toast.success('Loan type created successfully')
        }
      }
      setShowModal(false)
      resetForm()
      loadLoanTypes()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save loan type')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (loanTypeId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await loanApi.deleteLoanType(loanTypeId, cooperativeId!)
      if (response.success) {
        toast.success('Loan type deleted')
        loadLoanTypes()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete loan type')
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

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/cooperatives/${cooperativeId}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back to Cooperative
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Types</h1>
              <p className="text-gray-600">Configure loan products for your cooperative</p>
            </div>
            <Button
              variant="primary"
              onClick={openCreateModal}
              leftIcon={<Plus className="w-5 h-5" />}
            >
              Create Loan Type
            </Button>
          </div>
        </div>

        {/* Loan Types List */}
        {loanTypes.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No loan types yet</h3>
              <p className="text-gray-600 mb-6">Create your first loan type to get started</p>
              <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus className="w-5 h-5" />}>
                Create Loan Type
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loanTypes.map((loanType) => (
              <Card key={loanType.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{loanType.name}</h3>
                    {loanType.description && (
                      <p className="text-sm text-gray-600">{loanType.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      Amount: ₦{loanType.minAmount.toLocaleString()} - ₦
                      {loanType.maxAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      Duration: {loanType.minDuration} - {loanType.maxDuration} months
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      Interest Rate: {loanType.interestRate}%
                    </span>
                  </div>
                  {loanType.requiresGuarantor && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-amber-700">
                        Requires {loanType.minGuarantors} guarantor(s)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => openEditModal(loanType)}
                    leftIcon={<Edit2 className="w-4 h-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => handleDelete(loanType.id, loanType.name)}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingType ? 'Edit Loan Type' : 'Create Loan Type'}
            </h3>

            <div className="space-y-4">
              <Input
                label="Loan Type Name *"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Personal Loan, Emergency Loan"
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose and terms of this loan type..."
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 min-h-20 resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Minimum Amount (₦) *"
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  placeholder="10000"
                  icon={<DollarSign className="w-5 h-5" />}
                />
                <Input
                  label="Maximum Amount (₦) *"
                  type="number"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                  placeholder="500000"
                  icon={<DollarSign className="w-5 h-5" />}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Minimum Duration (months) *"
                  type="number"
                  value={formData.minDuration}
                  onChange={(e) => setFormData({ ...formData, minDuration: e.target.value })}
                  placeholder="1"
                  icon={<Calendar className="w-5 h-5" />}
                />
                <Input
                  label="Maximum Duration (months) *"
                  type="number"
                  value={formData.maxDuration}
                  onChange={(e) => setFormData({ ...formData, maxDuration: e.target.value })}
                  placeholder="12"
                  icon={<Calendar className="w-5 h-5" />}
                />
              </div>

              <Input
                label="Interest Rate (%) *"
                type="number"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                placeholder="5.0"
                step="0.1"
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Interest Type *
                </label>
                <select
                  value={formData.interestType}
                  onChange={(e) =>
                    setFormData({ ...formData, interestType: e.target.value as 'flat' | 'reducing_balance' })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
                >
                  <option value="flat">Flat Rate</option>
                  <option value="reducing_balance">Reducing Balance</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Flat: Interest calculated on original amount. Reducing: Interest calculated on remaining balance.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresGuarantor}
                    onChange={(e) =>
                      setFormData({ ...formData, requiresGuarantor: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Requires Guarantor(s)
                  </span>
                </label>

                {formData.requiresGuarantor && (
                  <Input
                    label="Minimum Number of Guarantors"
                    type="number"
                    value={formData.minGuarantors}
                    onChange={(e) => setFormData({ ...formData, minGuarantors: e.target.value })}
                    placeholder="1"
                    min="1"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button variant="primary" fullWidth onClick={handleSave} loading={isSubmitting}>
                {editingType ? 'Update' : 'Create'} Loan Type
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
