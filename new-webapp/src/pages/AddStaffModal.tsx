import React, { useState } from 'react'
import { Button, Card, Input, useToast } from '../components/ui'
import { X, Users, Check } from 'lucide-react'
import { organizationApi } from '../api/organizationApi'
import type { AddStaffDto } from '../types'

interface AddStaffModalProps {
  isOpen: boolean
  organizationId: string
  onClose: () => void
  onSuccess: () => void
}

const ROLES = [
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Full access to all organization features'
  },
  {
    value: 'supervisor',
    label: 'Supervisor',
    description: 'Can manage cooperatives and oversee operations'
  },
  {
    value: 'field_agent',
    label: 'Field Agent',
    description: 'Works directly with cooperative members'
  },
  {
    value: 'accountant',
    label: 'Accountant',
    description: 'Manages financial records and transactions'
  }
]

const PERMISSIONS = [
  {
    id: 'manage_cooperatives',
    label: 'Manage Cooperatives',
    description: 'Create, edit, and delete cooperatives'
  },
  {
    id: 'manage_members',
    label: 'Manage Members',
    description: 'Add, edit, and remove cooperative members'
  },
  {
    id: 'view_reports',
    label: 'View Reports',
    description: 'Access financial and activity reports'
  },
  {
    id: 'manage_finances',
    label: 'Manage Finances',
    description: 'Handle loans, contributions, and expenses'
  },
  {
    id: 'system_admin',
    label: 'System Administration',
    description: 'Advanced system configuration and user management'
  }
]

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  organizationId,
  onClose,
  onSuccess
}) => {
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<AddStaffDto>({
    userId: '',
    role: 'field_agent',
    permissions: []
  })

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role: role as any,
      // Set default permissions based on role
      permissions: getDefaultPermissions(role)
    }))
  }

  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return PERMISSIONS.map(p => p.id)
      case 'supervisor':
        return ['manage_cooperatives', 'manage_members', 'view_reports', 'manage_finances']
      case 'field_agent':
        return ['manage_members', 'view_reports']
      case 'accountant':
        return ['view_reports', 'manage_finances']
      default:
        return []
    }
  }

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.userId.trim()) {
      toast.error('User ID is required')
      return
    }

    if (formData.permissions.length === 0) {
      toast.error('At least one permission must be selected')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await organizationApi.addStaff(organizationId, formData)
      
      if (response.success) {
        toast.success('Staff member added successfully')
        onSuccess()
        onClose()
        setFormData({
          userId: '',
          role: 'field_agent',
          permissions: []
        })
      } else {
        toast.error(response.message || 'Failed to add staff member')
      }
    } catch (error) {
      console.error('Failed to add staff member:', error)
      toast.error('Failed to add staff member')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Add Staff Member</h2>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID *
              </label>
              <Input
                type="text"
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="Enter the user's ID or email"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the unique user ID or email address of the person to add
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Role *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ROLES.map((role) => (
                  <div
                    key={role.value}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.role === role.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleRoleChange(role.value)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.role === role.value
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {formData.role === role.value && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{role.label}</h3>
                        <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Permissions *
              </label>
              <div className="space-y-3">
                {PERMISSIONS.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handlePermissionToggle(permission.id)}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center ${
                      formData.permissions.includes(permission.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.permissions.includes(permission.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{permission.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                    </div>
                  </div>
                ))}
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
                  'Add Staff'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}