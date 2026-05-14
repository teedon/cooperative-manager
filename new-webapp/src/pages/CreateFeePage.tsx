import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button, Card, useToast } from '../components/ui'
import { feeApi, type CreateFeeDto, type CooperativeFee } from '../api/feeApi'

export const CreateFeePage = () => {
  const { id, feeId } = useParams<{ id: string; feeId?: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const isEditing = Boolean(feeId)

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [formData, setFormData] = useState<CreateFeeDto>({
    name: '',
    description: '',
    amount: 0,
    isActive: true,
  })

  useEffect(() => {
    if (isEditing && feeId && id) {
      loadExistingFees()
    }
  }, [feeId, id])

  const loadExistingFees = async () => {
    if (!id) return
    try {
      setIsLoading(true)
      const res = await feeApi.getFees(id)
      if (res.success) {
        const fee: CooperativeFee = res.data.find((f: CooperativeFee) => f.id === feeId)
        if (fee) {
          setFormData({
            name: fee.name,
            description: fee.description || '',
            amount: fee.amount,
            isActive: fee.isActive,
          })
        }
      }
    } catch {
      toast.error('Failed to load fee details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    if (!formData.name.trim()) {
      toast.error('Fee name is required')
      return
    }
    if (!formData.amount || formData.amount < 1) {
      toast.error('Amount must be at least ₦1')
      return
    }

    try {
      setIsSaving(true)
      let res
      if (isEditing && feeId) {
        res = await feeApi.updateFee(feeId, formData)
      } else {
        res = await feeApi.createFee(id, formData)
      }
      if (res.success) {
        toast.success(isEditing ? 'Fee updated successfully' : 'Fee created successfully')
        navigate(`/cooperatives/${id}/fees`)
      } else {
        toast.error(res.message || 'Failed to save fee')
      }
    } catch {
      toast.error('Failed to save fee')
    } finally {
      setIsSaving(false)
    }
  }

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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/cooperatives/${id}/fees`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Fee' : 'Create Fee'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing ? 'Update fee details' : 'Create a new one-time fee for members'}
            </p>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fee Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Registration Fee, ID Card Fee"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this fee is for"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₦) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: parseInt(e.target.value) || 0 }))
                }
                placeholder="0"
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active (members can make payments)
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/cooperatives/${id}/fees`)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="flex-1 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : isEditing ? 'Update Fee' : 'Create Fee'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
