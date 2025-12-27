import React, { useState } from 'react'
import { X, Building2, FileText, Image as ImageIcon, Palette } from 'lucide-react'
import { Button, Input, Card, useToast } from '../components/ui'
import { cooperativeApi } from '../api/cooperativeApi'
import type { Cooperative } from '../types'

interface CreateCooperativeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (cooperative: Cooperative) => void
}

const GRADIENT_PRESETS = [
  { name: 'Ocean', colors: ['#667eea', '#764ba2'], value: 'ocean' },
  { name: 'Sunset', colors: ['#f093fb', '#f5576c'], value: 'sunset' },
  { name: 'Forest', colors: ['#56ab2f', '#a8e063'], value: 'forest' },
  { name: 'Lavender', colors: ['#a18cd1', '#fbc2eb'], value: 'lavender' },
  { name: 'Coral', colors: ['#ff9a9e', '#fecfef'], value: 'coral' },
  { name: 'Midnight', colors: ['#2c3e50', '#3498db'], value: 'midnight' },
  { name: 'Emerald', colors: ['#11998e', '#38ef7d'], value: 'emerald' },
  { name: 'Rose', colors: ['#ee0979', '#ff6a00'], value: 'rose' },
  { name: 'Slate', colors: ['#536976', '#292e49'], value: 'slate' },
  { name: 'Amber', colors: ['#f12711', '#f5af19'], value: 'amber' },
]

export const CreateCooperativeModal: React.FC<CreateCooperativeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    useGradient: true,
    gradientPreset: 'ocean',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Cooperative name is required'
    } else if (formData.name.length < 3) {
      errors.name = 'Name must be at least 3 characters'
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must not exceed 500 characters'
    }

    if (!formData.useGradient && formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      errors.imageUrl = 'Please enter a valid image URL'
    }

    return errors
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      toast.error(Object.values(errors)[0])
      return
    }

    try {
      setIsSubmitting(true)
      const response = await cooperativeApi.create({
        name: formData.name,
        description: formData.description || undefined,
        imageUrl: formData.useGradient ? undefined : formData.imageUrl || undefined,
        useGradient: formData.useGradient,
        gradientPreset: formData.useGradient ? formData.gradientPreset : undefined,
      })

      if (response.success) {
        toast.success(`${formData.name} created successfully!`)
        onSuccess(response.data)
        handleClose()
      }
    } catch (error: any) {
      console.error('Failed to create cooperative:', error)
      const errorMessage =
        error.response?.data?.message || 'Failed to create cooperative. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      useGradient: true,
      gradientPreset: 'ocean',
    })
    setValidationErrors({})
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create Cooperative</h2>
                <p className="text-sm text-gray-600">Set up your new cooperative organization</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <Input
                label="Cooperative Name"
                type="text"
                placeholder="e.g., Tech Professionals Cooperative"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={validationErrors.name}
                icon={<Building2 className="w-5 h-5" />}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
                <span className="text-gray-400 font-normal ml-2">(Optional)</span>
              </label>
              <div className="relative">
                <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <textarea
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  placeholder="Describe your cooperative's purpose and goals..."
                  className={`
                    w-full pl-11 pr-4 py-3 bg-white border-2 rounded-xl text-gray-900 
                    placeholder:text-gray-400 focus:outline-none transition-all duration-300
                    min-h-[100px] resize-y
                    ${
                      validationErrors.description
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                    }
                  `}
                  maxLength={500}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                {validationErrors.description && (
                  <p className="text-sm text-red-600">{validationErrors.description}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  {formData.description.length}/500 characters
                </p>
              </div>
            </div>

            {/* Appearance Options */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Cooperative Appearance
              </label>

              {/* Toggle between Gradient and Image */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, useGradient: true }))}
                  className={`
                    flex-1 p-4 rounded-xl border-2 transition-all duration-300
                    ${
                      formData.useGradient
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Palette
                      className={`w-5 h-5 ${formData.useGradient ? 'text-blue-600' : 'text-gray-400'}`}
                    />
                    <div className="text-left">
                      <p
                        className={`font-semibold ${formData.useGradient ? 'text-blue-900' : 'text-gray-700'}`}
                      >
                        Gradient
                      </p>
                      <p className="text-xs text-gray-600">Use colorful gradients</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, useGradient: false }))}
                  className={`
                    flex-1 p-4 rounded-xl border-2 transition-all duration-300
                    ${
                      !formData.useGradient
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <ImageIcon
                      className={`w-5 h-5 ${!formData.useGradient ? 'text-blue-600' : 'text-gray-400'}`}
                    />
                    <div className="text-left">
                      <p
                        className={`font-semibold ${!formData.useGradient ? 'text-blue-900' : 'text-gray-700'}`}
                      >
                        Custom Image
                      </p>
                      <p className="text-xs text-gray-600">Use your own image</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Gradient Selector */}
              {formData.useGradient && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Choose Gradient
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, gradientPreset: preset.value }))
                        }
                        className={`
                          relative h-20 rounded-xl transition-all duration-300 overflow-hidden
                          ${
                            formData.gradientPreset === preset.value
                              ? 'ring-4 ring-blue-500 ring-offset-2 scale-105'
                              : 'hover:scale-105'
                          }
                        `}
                        style={{
                          background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`,
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors">
                          <span className="text-white font-semibold text-sm drop-shadow-lg">
                            {preset.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image URL Input */}
              {!formData.useGradient && (
                <div>
                  <Input
                    label="Image URL"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={handleInputChange('imageUrl')}
                    error={validationErrors.imageUrl}
                    icon={<ImageIcon className="w-5 h-5" />}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide a direct link to an image (JPEG, PNG, or WebP)
                  </p>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Preview</label>
              <div
                className="h-32 rounded-xl overflow-hidden border-2 border-gray-200 flex items-center justify-center relative"
                style={{
                  background: formData.useGradient
                    ? `linear-gradient(135deg, ${
                        GRADIENT_PRESETS.find((p) => p.value === formData.gradientPreset)
                          ?.colors[0]
                      }, ${
                        GRADIENT_PRESETS.find((p) => p.value === formData.gradientPreset)
                          ?.colors[1]
                      })`
                    : formData.imageUrl
                      ? `url(${formData.imageUrl}) center/cover`
                      : '#f3f4f6',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">
                      {formData.name || 'Your Cooperative Name'}
                    </h3>
                    {formData.description && (
                      <p className="text-sm text-white/90 drop-shadow line-clamp-2">
                        {formData.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Cooperative'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
