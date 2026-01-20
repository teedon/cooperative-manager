import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, useToast, Input } from '../components/ui'
import { 
  Building2, Users, Plus, Search, Filter,
  Eye, Settings, Activity,
  ArrowLeft
} from 'lucide-react'
import { organizationApi } from '../api/organizationApi'
import type { Organization } from '../types'
import { CreateOrganizationModal } from './CreateOrganizationModal'

export const OrganizationsPage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    cooperativeOrganizations: 0,
    managerOrganizations: 0,
    averageCooperativesPerManager: 0,
    totalStaff: 0,
    organizationGrowth: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadOrganizations()
  }, [currentPage, searchQuery])

  useEffect(() => {
    if (allOrganizations.length > 0) {
      loadStats()
    }
  }, [allOrganizations])

  const loadOrganizations = async () => {
    try {
      setIsLoading(true)
      const response = await organizationApi.getAll() // Client API returns all organizations
      
      if (response.success) {
        const allOrgs = Array.isArray(response.data) ? response.data : []
        setAllOrganizations(allOrgs)
        
        // Apply client-side filtering and pagination
        const filteredOrgs = searchQuery 
          ? allOrgs.filter(org => 
              org && org.name && org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (org && org.description && org.description.toLowerCase().includes(searchQuery.toLowerCase()))
            )
          : allOrgs
        
        const itemsPerPage = 10
        const totalPages = Math.ceil(filteredOrgs.length / itemsPerPage)
        setTotalPages(totalPages)
        
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedOrgs = filteredOrgs.slice(startIndex, endIndex)
        
        setOrganizations(paginatedOrgs)
      } else {
        toast.error(response.message || 'Failed to load organizations')
        setOrganizations([])
        setAllOrganizations([])
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
      toast.error('Failed to load organizations')
      setOrganizations([])
      setAllOrganizations([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    // Note: Client API doesn't have global stats - stats are per organization
    // For now, we'll calculate basic stats from the organizations list
    try {
      // Use the allOrganizations data that's already loaded
      if (allOrganizations.length > 0) {
        const orgs = allOrganizations
        setStats({
          totalOrganizations: orgs.length,
          cooperativeOrganizations: orgs.filter(org => org.type === 'cooperative').length,
          managerOrganizations: orgs.filter(org => org.type === 'manager').length,
          averageCooperativesPerManager: 0, // Not available in client API
          totalStaff: orgs.reduce((sum, org) => sum + (org.staffCount || 0), 0),
          organizationGrowth: 0 // Not available in client API
        })
      }
    } catch (error) {
      console.error('Failed to load organization stats:', error)
    }
  }

  // Check if user has admin role for an organization
  const hasAdminRole = (org: Organization) => {
    return org.userRole === 'admin'
  }

  // Check if user has specific permission for an organization
  const hasPermission = (org: Organization, permission: string) => {
    return org.userPermissions?.includes(permission) || false
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page when searching
    // The useEffect will trigger loadOrganizations with the new searchQuery
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                onClick={() => navigate('/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
                <p className="text-gray-600 mt-1">
                  Manage cooperative organizations and staff
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Organization</span>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Organizations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrganizations}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cooperative Orgs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cooperativeOrganizations}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Manager Orgs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.managerOrganizations}</p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <form onSubmit={handleSearch} className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search organizations by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </Card>

        {/* Organizations Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cooperatives
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                        <div className="text-sm text-gray-500">{org.description}</div>
                        <div className="text-xs text-gray-400">Created {formatDate(org.createdAt)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        org.type === 'cooperative' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {org.type === 'cooperative' ? 'Cooperative' : 'Manager'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {org.staffCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {org.cooperativesCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(org.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {org.userRole ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          org.userRole === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : org.userRole === 'supervisor'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {org.userRole.charAt(0).toUpperCase() + org.userRole.slice(1).replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No role</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        org.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/organizations/${org.id}`)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* Only show manage button for admins and supervisors with appropriate permissions */}
                        {hasAdminRole(org) || hasPermission(org, 'manage_settings') ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/organizations/${org.id}/settings`)}
                            title="Manage Organization"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Create Organization Modal */}
        {showCreateModal && (
          <CreateOrganizationModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              loadOrganizations()
              loadStats()
            }}
          />
        )}
      </div>
    </div>
  )
}