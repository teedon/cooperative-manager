import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Image as ImageIcon, Check } from 'lucide-react'
import { Button, Card, Input, useToast } from '../components/ui'
import { cooperativeApi } from '../api/cooperativeApi'

// Gradient presets configuration
const GRADIENT_PRESETS = {
  ocean: {
    colors: ['#0077B6', '#00B4D8', '#90E0EF'],
    name: 'Ocean',
    description: 'Deep blue to aqua gradient',
  },
  sunset: {
    colors: ['#F97316', '#FB923C', '#FCD34D'],
    name: 'Sunset',
    description: 'Warm orange to golden yellow',
  },
  forest: {
    colors: ['#166534', '#22C55E', '#86EFAC'],
    name: 'Forest',
    description: 'Deep green to fresh mint',
  },
  lavender: {
    colors: ['#7C3AED', '#A78BFA', '#DDD6FE'],
    name: 'Lavender',
    description: 'Rich purple to soft lavender',
  },
  coral: {
    colors: ['#DC2626', '#FB7185', '#FECDD3'],
    name: 'Coral',
    description: 'Vibrant red to soft pink',
  },
  midnight: {
    colors: ['#1E1B4B', '#3730A3', '#6366F1'],
    name: 'Midnight',
    description: 'Deep indigo to bright violet',
  },
  emerald: {
    colors: ['#047857', '#10B981', '#6EE7B7'],
    name: 'Emerald',
    description: 'Rich emerald to teal',
  },
  rose: {
    colors: ['#BE185D', '#EC4899', '#FBCFE8'],
    name: 'Rose',
    description: 'Deep pink to soft rose',
  },
  slate: {
    colors: ['#334155', '#64748B', '#CBD5E1'],
    name: 'Slate',
    description: 'Professional dark to light gray',
  },
  amber: {
    colors: ['#B45309', '#F59E0B', '#FDE68A'],
    name: 'Amber',
    description: 'Rich amber to golden yellow',
  },
} as const

type GradientPreset = keyof typeof GRADIENT_PRESETS

export const CooperativeSettingsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [useGradient, setUseGradient] = useState(true)
  const [gradientPreset, setGradientPreset] = useState<GradientPreset>('ocean')
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    loadCooperative()
  }, [id])

  const loadCooperative = async () => {
    if (!id) return

    try {
      setIsLoading(true)
      const response = await cooperativeApi.getById(id)
      const coop = response.data

      setName(coop.name || '')
      setDescription(coop.description || '')
      setUseGradient(coop.useGradient !== false)
      setGradientPreset((coop.gradientPreset || 'ocean') as GradientPreset)
      setImageUrl(coop.imageUrl || '')
    } catch (error: any) {
      console.error('Failed to load cooperative:', error)
      toast.error('Failed to load cooperative settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!id || !name.trim()) {
      toast.error('Cooperative name is required')
      return
    }

    try {
      setIsSaving(true)
      await cooperativeApi.update(id, {
        name: name.trim(),
        description: description.trim() || undefined,
        useGradient,
        gradientPreset,
        imageUrl: !useGradient && imageUrl.trim() ? imageUrl.trim() : undefined,
      })

      toast.success('Cooperative settings updated successfully')
      navigate(`/cooperatives/${id}`)
    } catch (error: any) {
      console.error('Failed to update cooperative:', error)
      toast.error(error.response?.data?.message || 'Failed to update cooperative settings')
    } finally {
      setIsSaving(false)
    }
  }

  const getGradientStyle = (preset: GradientPreset) => {
    const config = GRADIENT_PRESETS[preset]
    return {
      background: `linear-gradient(135deg, ${config.colors.join(', ')})`,
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/cooperatives/${id}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cooperative Settings</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your cooperative's appearance and information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Preview Section */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Preview</h2>
            <div className="relative h-35 rounded-lg overflow-hidden shadow-md">
              {useGradient ? (
                <div style={getGradientStyle(gradientPreset)} className="h-full relative">
                  {/* Decorative circles */}
                  <div className="absolute top--10 right--5 w-37.5 h-37.5 rounded-full bg-white opacity-8"></div>
                  <div className="absolute bottom--7.5 left-5 w-25 h-25 rounded-full bg-white opacity-8"></div>
                  
                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-40 p-4">
                    <h3 className="text-white text-lg font-bold">{name || 'Cooperative Name'}</h3>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  <p className="text-sm">Custom Image</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Basic Information */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cooperative Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter cooperative name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a brief description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Background Settings */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Background Settings</h2>

            {/* Toggle for Gradient */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
              <div>
                <p className="text-sm font-medium text-gray-900">Use Gradient Background</p>
                <p className="text-xs text-gray-500 mt-1">
                  {useGradient
                    ? 'Professional gradient with decorative elements'
                    : 'Custom image background'}
                </p>
              </div>
              <button
                onClick={() => setUseGradient(!useGradient)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useGradient ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useGradient ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Gradient Presets */}
            {useGradient && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Choose a Gradient</h3>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(GRADIENT_PRESETS) as GradientPreset[]).map((preset) => {
                    const config = GRADIENT_PRESETS[preset]
                    const isSelected = preset === gradientPreset

                    return (
                      <button
                        key={preset}
                        onClick={() => setGradientPreset(preset)}
                        className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                          isSelected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent'
                        }`}
                      >
                        <div
                          style={getGradientStyle(preset)}
                          className="h-15 flex items-center justify-center"
                        >
                          {isSelected && (
                            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-white">
                          <p className={`text-xs font-semibold text-center ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                            {config.name}
                          </p>
                          <p className="text-2xs text-gray-500 text-center truncate">
                            {config.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Custom Image URL */}
            {!useGradient && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Image URL
                </label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter a URL to an image. Recommended size: 800x400 pixels.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/cooperatives/${id}`)}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
