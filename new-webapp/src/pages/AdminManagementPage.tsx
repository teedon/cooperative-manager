import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Shield,
  UserPlus,
  Settings as SettingsIcon,
  UserMinus,
  Crown,
  CheckSquare,
  Square,
  MinusSquare,
  X,
} from 'lucide-react'
import { Button, Card, useToast } from '../components/ui'
import { cooperativeApi } from '../api/cooperativeApi'
import type { CooperativeMember, PredefinedRole, PredefinedRoleType } from '../types'
import { PERMISSIONS, PERMISSION_GROUPS, PERMISSION_LABELS, type Permission } from '../constants/permissions'

export const AdminManagementPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [admins, setAdmins] = useState<CooperativeMember[]>([])
  const [allMembers, setAllMembers] = useState<CooperativeMember[]>([])
  const [predefinedRoles, setPredefinedRoles] = useState<PredefinedRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<CooperativeMember | null>(null)
  const [selectedRole, setSelectedRole] = useState<'admin' | 'moderator'>('moderator')
  const [selectedPredefinedRole, setSelectedPredefinedRole] = useState<PredefinedRoleType | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    if (!id) return

    try {
      setIsLoading(true)
      const [adminsRes, membersRes, rolesRes] = await Promise.all([
        cooperativeApi.getAdmins(id),
        cooperativeApi.getMembers(id),
        cooperativeApi.getPredefinedRoles(),
      ])

      if (adminsRes.success) {
        setAdmins(adminsRes.data)
      }

      if (membersRes.success) {
        // Filter out existing admins/moderators
        const regularMembers = membersRes.data.filter(
          (m) => m.role === 'member' && m.status === 'active'
        )
        setAllMembers(regularMembers)
      }

      if (rolesRes.success) {
        setPredefinedRoles(rolesRes.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAdmin = (member: CooperativeMember) => {
    setSelectedMember(member)
    setSelectedRole('moderator')
    setSelectedPredefinedRole(null)
    setSelectedPermissions([])
    setShowAddModal(true)
  }

  const handleSelectPredefinedRole = (role: PredefinedRole) => {
    setSelectedPredefinedRole(role.role)
    setSelectedPermissions(role.permissions)
    if (role.role === 'president') {
      setSelectedRole('admin')
    } else {
      setSelectedRole('moderator')
    }
  }

  const handlePromoteMember = async () => {
    if (!selectedMember || !id) return

    try {
      setIsSubmitting(true)
      const response = await cooperativeApi.updateMemberRoleWithPermissions(
        id,
        selectedMember.id,
        selectedRole,
        selectedRole === 'moderator' ? selectedPermissions : undefined,
        selectedPredefinedRole
      )

      if (response.success) {
        toast.success('Member promoted successfully')
        setShowAddModal(false)
        setSelectedMember(null)
        await loadData()
      }
    } catch (error: any) {
      console.error('Error promoting member:', error)
      toast.error(error.response?.data?.message || 'Failed to promote member')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPermissions = (admin: CooperativeMember) => {
    setSelectedMember(admin)
    setSelectedPermissions(admin.permissions || [])
    setShowPermissionsModal(true)
  }

  const handleSavePermissions = async () => {
    if (!selectedMember || !id) return

    try {
      setIsSubmitting(true)
      const response = await cooperativeApi.updateMemberPermissions(
        id,
        selectedMember.id,
        selectedPermissions
      )

      if (response.success) {
        toast.success('Permissions updated successfully')
        setShowPermissionsModal(false)
        setSelectedMember(null)
        await loadData()
      }
    } catch (error: any) {
      console.error('Error updating permissions:', error)
      toast.error(error.response?.data?.message || 'Failed to update permissions')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveAdmin = async (admin: CooperativeMember) => {
    const firstName = admin.user?.firstName || admin.firstName || 'Unknown'
    const lastName = admin.user?.lastName || admin.lastName || ''

    if (!window.confirm(`Remove admin privileges from ${firstName} ${lastName}?`)) {
      return
    }

    try {
      const response = await cooperativeApi.removeAdmin(id!, admin.id)
      if (response.success) {
        toast.success('Admin privileges removed')
        await loadData()
      }
    } catch (error: any) {
      console.error('Error removing admin:', error)
      toast.error(error.response?.data?.message || 'Failed to remove admin')
    }
  }

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    )
  }

  const toggleGroup = (groupPermissions: string[]) => {
    const allSelected = groupPermissions.every((p) => selectedPermissions.includes(p))
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !groupPermissions.includes(p)))
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...groupPermissions])])
    }
  }

  const getRoleTitleLabel = (roleTitle?: PredefinedRoleType): string => {
    const labels: Record<PredefinedRoleType, string> = {
      president: 'President',
      vice_president: 'Vice President',
      secretary: 'Secretary',
      financial_secretary: 'Financial Secretary',
      treasurer: 'Treasurer',
      pro: 'PRO',
      auditor: 'Auditor',
      welfare_officer: 'Welfare Officer',
    }
    return roleTitle ? labels[roleTitle] : ''
  }

  const getRoleIcon = (roleTitle?: PredefinedRoleType): string => {
    const icons: Record<PredefinedRoleType, string> = {
      president: '👑',
      vice_president: '🏛️',
      secretary: '📝',
      financial_secretary: '📊',
      treasurer: '💰',
      pro: '📢',
      auditor: '🔍',
      welfare_officer: '🤝',
    }
    return roleTitle ? icons[roleTitle] : ''
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/cooperatives/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Cooperative</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Admins</h1>
              <p className="text-gray-600 mt-1">Control who can administer this cooperative</p>
            </div>
            <Button
              variant="primary"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => setShowAddModal(true)}
              disabled={allMembers.length === 0}
            >
              Add Admin/Moderator
            </Button>
          </div>
        </div>

        {/* Current Admins */}
        <div className="space-y-4">
          {admins.map((admin) => {
            const isFullAdmin = admin.role === 'admin'
            const firstName = admin.user?.firstName || admin.firstName || 'Unknown'
            const lastName = admin.user?.lastName || admin.lastName || ''
            const email = admin.user?.email || admin.email || ''
            const hasRoleTitle = !!admin.roleTitle
            const roleIcon = getRoleIcon(admin.roleTitle)
            const roleTitleLabel = getRoleTitleLabel(admin.roleTitle)

            return (
              <Card key={admin.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-700 font-semibold text-lg">
                        {firstName[0]}
                        {lastName[0] || ''}
                      </span>
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {firstName} {lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{email}</p>

                      {/* Role Badge */}
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            isFullAdmin
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {hasRoleTitle ? (
                            <>
                              <span className="mr-1">{roleIcon}</span>
                              {roleTitleLabel}
                            </>
                          ) : isFullAdmin ? (
                            <>
                              <Crown className="w-4 h-4 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-1" />
                              Moderator
                            </>
                          )}
                        </span>
                      </div>

                      {/* Permissions Preview */}
                      {!isFullAdmin && admin.permissions && admin.permissions.length > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          {admin.permissions.length} of {Object.keys(PERMISSIONS).length}{' '}
                          permissions
                        </p>
                      )}

                      {isFullAdmin && (
                        <p className="text-sm text-green-600 mt-2">Full access to all features</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isFullAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<SettingsIcon className="w-4 h-4" />}
                        onClick={() => handleEditPermissions(admin)}
                      >
                        Edit Permissions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<UserMinus className="w-4 h-4" />}
                        onClick={() => handleRemoveAdmin(admin)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}

          {admins.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Admins Yet</h3>
                <p className="text-gray-600 mb-6">Add admins to help manage this cooperative</p>
                <Button
                  variant="primary"
                  leftIcon={<UserPlus className="w-4 h-4" />}
                  onClick={() => setShowAddModal(true)}
                  disabled={allMembers.length === 0}
                >
                  Add First Admin
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Add Admin Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add Admin/Moderator</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!selectedMember ? (
                <>
                  <p className="text-gray-600 mb-4">Select a member to promote:</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {allMembers.map((member) => {
                      const firstName = member.user?.firstName || member.firstName || 'Unknown'
                      const lastName = member.user?.lastName || member.lastName || ''
                      const email = member.user?.email || member.email || ''

                      return (
                        <button
                          key={member.id}
                          onClick={() => handleAddAdmin(member)}
                          className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-indigo-500 transition-colors flex items-center gap-3"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-700 font-semibold">
                              {firstName[0]}
                              {lastName[0] || ''}
                            </span>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-900">
                              {firstName} {lastName}
                            </p>
                            <p className="text-sm text-gray-600">{email}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  {/* Selected Member Info */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Selected Member:</p>
                    <p className="font-semibold text-gray-900">
                      {selectedMember.user?.firstName || selectedMember.firstName}{' '}
                      {selectedMember.user?.lastName || selectedMember.lastName}
                    </p>
                  </div>

                  {/* Role Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          setSelectedRole('admin')
                          setSelectedPredefinedRole(null)
                        }}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          selectedRole === 'admin'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Crown className="w-6 h-6 text-purple-600 mb-2" />
                        <h3 className="font-semibold text-gray-900">Admin</h3>
                        <p className="text-sm text-gray-600">Full access to all features</p>
                      </button>

                      <button
                        onClick={() => setSelectedRole('moderator')}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          selectedRole === 'moderator'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Shield className="w-6 h-6 text-blue-600 mb-2" />
                        <h3 className="font-semibold text-gray-900">Moderator</h3>
                        <p className="text-sm text-gray-600">Custom permissions</p>
                      </button>
                    </div>
                  </div>

                  {/* Predefined Roles (for moderators) */}
                  {selectedRole === 'moderator' && predefinedRoles.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Predefined Roles (Optional)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {predefinedRoles.map((role) => {
                          const icon = getRoleIcon(role.role)
                          return (
                            <button
                              key={role.role}
                              onClick={() => handleSelectPredefinedRole(role)}
                              className={`p-3 border-2 rounded-lg text-left transition-colors ${
                                selectedPredefinedRole === role.role
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{icon}</span>
                                <h4 className="font-semibold text-gray-900 text-sm">{role.label}</h4>
                              </div>
                              <p className="text-xs text-gray-600">{role.description}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Custom Permissions (for moderators) */}
                  {selectedRole === 'moderator' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Custom Permissions
                      </label>
                      <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                        {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
                          const groupPermissions = group.permissions
                          const selectedCount = groupPermissions.filter((p) =>
                            selectedPermissions.includes(p)
                          ).length
                          const allSelected = selectedCount === groupPermissions.length

                          return (
                            <div key={groupKey} className="space-y-2">
                              <button
                                onClick={() => toggleGroup(groupPermissions)}
                                className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded"
                              >
                                {allSelected ? (
                                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                                ) : selectedCount > 0 ? (
                                  <MinusSquare className="w-5 h-5 text-indigo-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-gray-400" />
                                )}
                                <span className="font-semibold text-gray-900">{group.label}</span>
                                <span className="text-sm text-gray-500 ml-auto">
                                  {selectedCount}/{groupPermissions.length}
                                </span>
                              </button>

                              <div className="ml-8 space-y-1">
                                {groupPermissions.map((permission) => (
                                  <button
                                    key={permission}
                                    onClick={() => togglePermission(permission)}
                                    className="flex items-center gap-2 w-full p-2 hover:bg-gray-50 rounded text-left"
                                  >
                                    {selectedPermissions.includes(permission) ? (
                                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                                    ) : (
                                      <Square className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="text-sm text-gray-700">
                                      {PERMISSION_LABELS[permission as Permission]}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMember(null)}
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handlePromoteMember}
                      disabled={isSubmitting || (selectedRole === 'moderator' && selectedPermissions.length === 0)}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Promoting...' : 'Promote Member'}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {/* Edit Permissions Modal */}
        {showPermissionsModal && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Permissions</h2>
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Editing permissions for:</p>
                <p className="font-semibold text-gray-900">
                  {selectedMember.user?.firstName || selectedMember.firstName}{' '}
                  {selectedMember.user?.lastName || selectedMember.lastName}
                </p>
              </div>

              <div className="space-y-4 max-h-125 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-6">
                {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
                  const groupPermissions = group.permissions
                  const selectedCount = groupPermissions.filter((p) =>
                    selectedPermissions.includes(p)
                  ).length
                  const allSelected = selectedCount === groupPermissions.length

                  return (
                    <div key={groupKey} className="space-y-2">
                      <button
                        onClick={() => toggleGroup(groupPermissions)}
                        className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded"
                      >
                        {allSelected ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        ) : selectedCount > 0 ? (
                          <MinusSquare className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="font-semibold text-gray-900">{group.label}</span>
                        <span className="text-sm text-gray-500 ml-auto">
                          {selectedCount}/{groupPermissions.length}
                        </span>
                      </button>

                      <div className="ml-8 space-y-1">
                        {groupPermissions.map((permission) => (
                          <button
                            key={permission}
                            onClick={() => togglePermission(permission)}
                            className="flex items-center gap-2 w-full p-2 hover:bg-gray-50 rounded text-left"
                          >
                            {selectedPermissions.includes(permission) ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-700">
                              {PERMISSION_LABELS[permission as Permission]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPermissionsModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSavePermissions}
                  disabled={isSubmitting || selectedPermissions.length === 0}
                  className="flex-1"
                >
                  {isSubmitting ? 'Saving...' : 'Save Permissions'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
