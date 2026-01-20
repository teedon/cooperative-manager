import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, useToast } from '../components/ui'
import { 
  ArrowLeft, Users, Plus, Mail, Phone, MapPin,
  Building2, Activity, DollarSign, Trash2
} from 'lucide-react'
import { organizationApi } from '../api/organizationApi'
import type { Organization, OrganizationStaff } from '../types'
import { AddStaffModal } from './AddStaffModal'

export const OrganizationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [staff, setStaff] = useState<OrganizationStaff[]>([])
  const [orgStats, setOrgStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [staffPage, setStaffPage] = useState(1)
  const [totalStaffPages, setTotalStaffPages] = useState(1)
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)

  useEffect(() => {
    if (id) {
      loadOrganizationDetails()
      loadOrganizationStats()
      loadStaff()
    }
  }, [id, staffPage])

  const loadOrganizationDetails = async () => {
    if (!id) return
    
    try {
      const response = await organizationApi.getById(id)
      if (response.success && response.data) {
        setOrganization(response.data)
      } else {
        toast.error(response.message || 'Failed to load organization details')
      }
    } catch (error) {
      console.error('Failed to load organization:', error)
      toast.error('Failed to load organization details')
    }
  }

  const loadOrganizationStats = async () => {
    if (!id) return
    
    try {
      const response = await organizationApi.getOrganizationStats(id)
      if (response.success && response.data) {
        setOrgStats(response.data)
      }
    } catch (error) {
      console.error('Failed to load organization stats:', error)
    }
  }

  const loadStaff = async () => {
    if (!id) return
    
    try {
      setIsLoading(true)
      const response = await organizationApi.getStaff(id, staffPage, 10)
      
      if (response.success && response.data) {
        setStaff(response.data.staff || [])
        setTotalStaffPages(response.data.totalPages || 1)
      } else {
        toast.error(response.message || 'Failed to load staff')
      }
    } catch (error) {
      console.error('Failed to load staff:', error)
      toast.error('Failed to load staff')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveStaff = async (staffId: string) => {
    if (!id || !confirm('Are you sure you want to remove this staff member?')) return
    
    try {
      const response = await organizationApi.removeStaff(id, staffId)
      
      if (response.success) {
        toast.success('Staff member removed successfully')
        loadStaff()
      } else {
        toast.error(response.message || 'Failed to remove staff member')
      }
    } catch (error) {
      console.error('Failed to remove staff:', error)
      toast.error('Failed to remove staff member')
    }
  }

  // Check if current user can remove a specific staff member
  const canRemoveStaff = (staffMember: OrganizationStaff) => {
    // Admins can remove anyone except themselves
    // Supervisors can only remove field agents and accountants if they have manage_staff permission
    if (organization?.userRole === 'admin') {
      // Don't allow removing self - we'd need the current user's ID to check this properly
      return true
    }
    if (organization?.userRole === 'supervisor' && organization?.userPermissions?.includes('manage_staff')) {
      return staffMember.role === 'field_agent' || staffMember.role === 'accountant'
    }
    return false
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      supervisor: 'bg-blue-100 text-blue-800',
      field_agent: 'bg-green-100 text-green-800',
      accountant: 'bg-purple-100 text-purple-800'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading && !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Not Found</h2>
          <p className="text-gray-600 mb-4">The requested organization could not be found.</p>
          <Button onClick={() => navigate('/organizations')}>
            Back to Organizations
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/organizations')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                <p className="text-gray-600 mt-1">{organization.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                organization.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {organization.status}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                organization.type === 'cooperative' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {organization.type === 'cooperative' ? 'Cooperative' : 'Manager'}
              </span>
            </div>
          </div>
        </div>

        {/* Organization Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{orgStats?.totalStaff || organization?.staffCount || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold text-gray-900">{orgStats?.activeStaff || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cooperatives</p>
                <p className="text-2xl font-bold text-gray-900">{orgStats?.totalCooperatives || organization?.cooperativesCount || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Collections</p>
                <p className="text-2xl font-bold text-gray-900">{orgStats?.totalCollections || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Contact Information */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">
                  {organization.contactInfo?.email || 'Not provided'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Phone</p>
                <p className="text-sm text-gray-600">
                  {organization.contactInfo?.phone || 'Not provided'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Address</p>
                <p className="text-sm text-gray-600">
                  {organization.contactInfo?.address || 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Staff Management */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
                <p className="text-sm text-gray-600">Manage organization staff and roles</p>
                {organization.userRole && (
                  <p className="text-xs text-blue-600 mt-1">
                    Your role: {organization.userRole.charAt(0).toUpperCase() + organization.userRole.slice(1).replace('_', ' ')}
                  </p>
                )}
              </div>
              {/* Only show Add Staff button for admins or supervisors with manage_staff permission */}
              {(organization.userRole === 'admin' || 
                (organization.userRole === 'supervisor' && organization.userPermissions?.includes('manage_staff'))) && (
                <Button
                  onClick={() => setShowAddStaffModal(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Staff</span>
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hired Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.user.firstName} {member.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{member.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.user.phone || 'Not provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(member.hiredAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canRemoveStaff(member) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStaff(member.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
                
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No staff members found. Add some staff to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Staff Pagination */}
          {totalStaffPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStaffPage(Math.max(1, staffPage - 1))}
                  disabled={staffPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {staffPage} of {totalStaffPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStaffPage(Math.min(totalStaffPages, staffPage + 1))}
                  disabled={staffPage === totalStaffPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Add Staff Modal */}
        {showAddStaffModal && id && (
          <AddStaffModal
            isOpen={showAddStaffModal}
            organizationId={id}
            onClose={() => setShowAddStaffModal(false)}
            onSuccess={loadStaff}
          />
        )}
      </div>
    </div>
  )
}