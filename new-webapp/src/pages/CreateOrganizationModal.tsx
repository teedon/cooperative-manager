import React, { useState } from 'react'
import { Button, Card, Input, useToast } from '../components/ui'
import { X, Building2, Mail, Phone, MapPin } from 'lucide-react'
import { organizationApi } from '../api/organizationApi'
import type { CreateOrganizationDto } from '../types'

interface CreateOrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateOrganizationDto>({
    name: '',
    type: 'cooperative',
    description: '',
    email: '',
    phone: '',
    address: ''
  })

  const handleInputChange = (field: keyof CreateOrganizationDto) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Organization name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await organizationApi.create(formData)
      
      if (response.success) {
        toast.success('Organization created successfully')
        onSuccess()
        onClose()
        setFormData({
          name: '',
          type: 'cooperative',
          description: '',
          email: '',
          phone: '',
          address: ''
        })
      } else {
        toast.error(response.message || 'Failed to create organization')
      }
    } catch (error) {
      console.error('Failed to create organization:', error)
      toast.error('Failed to create organization')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Create Organization</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="Enter organization name"
                required
              />
            </div>

            {/* Organization Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Type *
              </label>
              <select
                value={formData.type}
                onChange={handleInputChange('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="cooperative">Cooperative</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={handleInputChange('description')}
                placeholder="Brief description of the organization"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h3>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    placeholder="organization@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                  <textarea
                    value={formData.address}
                    onChange={handleInputChange('address')}
                    placeholder="Full address including city, state, and ZIP"
                    rows={2}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}