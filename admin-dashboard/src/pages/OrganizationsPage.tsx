import React, { useState, useEffect } from 'react';
import { organizationsApi } from '../lib/organizationsApi';
import type {
  Organization,
  OrganizationStats,
  OrganizationStaff,
  CreateOrganizationData,
  AddUserData,
} from '../lib/organizationsApi';
import { usersApi } from '../lib/usersApi';
import styles from './OrganizationsPage.module.css';

const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cooperative' | 'manager'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // New state for modals and forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [organizationStaff, setOrganizationStaff] = useState<OrganizationStaff[]>([]);
  const [createFormData, setCreateFormData] = useState<CreateOrganizationData>({
    name: '',
    type: 'cooperative',
    description: '',
    email: '',
    phone: '',
    address: ''
  });
  const [addUserFormData, setAddUserFormData] = useState<AddUserData>({
    userId: '',
    role: 'field_agent',
    permissions: [],
    employeeCode: ''
  });
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  
  useEffect(() => {
    if (userSearchTerm.length > 2) {
      fetchAvailableUsers();
    }
  }, [userSearchTerm]);

  useEffect(() => {
    fetchOrganizations();
    fetchStats();
  }, [currentPage, searchTerm, typeFilter]);

  const fetchOrganizations = async () => {
    try {
      const response = await organizationsApi.getOrganizations({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
      });
      
      setOrganizations(response.organizations);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await organizationsApi.getOrganizationStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching organization stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchOrganizations();
    fetchStats();
  };

  const fetchOrganizationStaff = async (organizationId: string) => {
    try {
      const response = await organizationsApi.getOrganizationStaff(organizationId);
      setOrganizationStaff(response.staff);
    } catch (error) {
      console.error('Error fetching organization staff:', error);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await usersApi.getUsers({
        page: 1,
        limit: 50,
        search: userSearchTerm || undefined,
      });
      setAvailableUsers(response.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateOrganization = async () => {
    try {
      const result = await organizationsApi.createOrganization(createFormData);
      if (result.success) {
        setShowCreateModal(false);
        setCreateFormData({
          name: '',
          type: 'cooperative',
          description: '',
          email: '',
          phone: '',
          address: ''
        });
        fetchOrganizations();
        fetchStats();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Error creating organization');
    }
  };

  const handleAddUserToOrganization = async () => {
    if (!selectedOrganization) return;

    try {
      const result = await organizationsApi.addUserToOrganization(
        selectedOrganization.id,
        addUserFormData
      );
      if (result.success) {
        setShowAddUserModal(false);
        setAddUserFormData({
          userId: '',
          role: 'field_agent',
          permissions: [],
          employeeCode: ''
        });
        fetchOrganizations();
        if (showStaffModal) {
          fetchOrganizationStaff(selectedOrganization.id);
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error adding user to organization:', error);
      alert('Error adding user to organization');
    }
  };

  const handleStatusUpdate = async (organizationId: string, newStatus: 'active' | 'inactive') => {
    try {
      const result = await organizationsApi.updateOrganizationStatus(organizationId, newStatus);
      if (result.success) {
        fetchOrganizations(); // Refresh the list
      } else {
        console.error('Failed to update organization status:', result.message);
        alert(result.message);
      }
    } catch (error) {
      console.error('Error updating organization status:', error);
      alert('Error updating organization status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTypeBadge = (type: string) => {
    const badgeClass = type === 'manager' ? styles.managerBadge : styles.cooperativeBadge;
    return (
      <span className={`${styles.badge} ${badgeClass}`}>
        {type === 'manager' ? 'Manager' : 'Cooperative'}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const badgeClass = status === 'active' ? styles.activeBadge : styles.inactiveBadge;
    return (
      <span className={`${styles.badge} ${badgeClass}`}>
        {status === 'active' ? 'Active' : 'Inactive'}
      </span>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading organizations...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1>Organizations Management</h1>
            <p>Manage organizations, cooperatives, and staff assignments</p>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={handleRefresh}
              className={styles.refreshButton}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className={styles.createButton}
            >
              Create Organization
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total Organizations</h3>
            <div className={styles.statValue}>{stats.totalOrganizations}</div>
            <div className={styles.statChange}>
              {stats.organizationGrowth > 0 ? '+' : ''}{stats.organizationGrowth.toFixed(1)}% from last month
            </div>
          </div>

          <div className={styles.statCard}>
            <h3>Cooperative Organizations</h3>
            <div className={styles.statValue}>{stats.cooperativeOrganizations}</div>
            <div className={styles.statSubtext}>Direct cooperatives</div>
          </div>

          <div className={styles.statCard}>
            <h3>Manager Organizations</h3>
            <div className={styles.statValue}>{stats.managerOrganizations}</div>
            <div className={styles.statSubtext}>Management businesses</div>
          </div>

          <div className={styles.statCard}>
            <h3>Total Staff</h3>
            <div className={styles.statValue}>{stats.totalStaff}</div>
            <div className={styles.statSubtext}>Active staff members</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | 'cooperative' | 'manager')}
          className={styles.filterSelect}
        >
          <option value="all">All Types</option>
          <option value="cooperative">Cooperative</option>
          <option value="manager">Manager</option>
        </select>
      </div>

      {/* Organizations Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Organization</th>
              <th>Type</th>
              <th>Cooperatives</th>
              <th>Staff</th>
              <th>Revenue</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr key={org.id}>
                <td>
                  <div className={styles.orgInfo}>
                    <div className={styles.orgName}>{org.name}</div>
                    {org.description && (
                      <div className={styles.orgDescription}>{org.description}</div>
                    )}
                    {(org.contactInfo.email || org.contactInfo.phone) && (
                      <div className={styles.contactInfo}>
                        {org.contactInfo.email && (
                          <span className={styles.contactItem}>{org.contactInfo.email}</span>
                        )}
                        {org.contactInfo.phone && (
                          <span className={styles.contactItem}>{org.contactInfo.phone}</span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td>{getTypeBadge(org.type)}</td>
                <td>
                  <span className={styles.countBadge}>{org.cooperativesCount}</span>
                </td>
                <td>
                  <span className={styles.countBadge}>{org.staffCount}</span>
                </td>
                <td>
                  <div className={styles.revenue}>
                    {formatCurrency(org.totalRevenue)}
                  </div>
                </td>
                <td>{getStatusBadge(org.status)}</td>
                <td>
                  {new Date(org.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      onClick={() => {
                        setSelectedOrganization(org);
                        fetchOrganizationStaff(org.id);
                        setShowStaffModal(true);
                      }}
                      className={`${styles.actionButton} ${styles.viewButton}`}
                    >
                      View Staff
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrganization(org);
                        fetchAvailableUsers();
                        setShowAddUserModal(true);
                      }}
                      className={`${styles.actionButton} ${styles.addUserButton}`}
                    >
                      Add User
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(
                        org.id, 
                        org.status === 'active' ? 'inactive' : 'active'
                      )}
                      className={`${styles.actionButton} ${
                        org.status === 'active' ? styles.deactivateButton : styles.activateButton
                      }`}
                    >
                      {org.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {organizations.length === 0 && (
          <div className={styles.emptyState}>
            <p>No organizations found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            Previous
          </button>
          
          <span className={styles.paginationInfo}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Create New Organization</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Organization Name *</label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                  className={styles.formInput}
                  placeholder="Enter organization name"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Organization Type *</label>
                <select
                  value={createFormData.type}
                  onChange={(e) => setCreateFormData({...createFormData, type: e.target.value as 'cooperative' | 'manager'})}
                  className={styles.formSelect}
                >
                  <option value="cooperative">Cooperative</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})}
                  className={styles.formTextarea}
                  placeholder="Enter organization description"
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                    className={styles.formInput}
                    placeholder="contact@organization.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({...createFormData, phone: e.target.value})}
                    className={styles.formInput}
                    placeholder="+234 xxx xxxx xxx"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Address</label>
                <input
                  type="text"
                  value={createFormData.address}
                  onChange={(e) => setCreateFormData({...createFormData, address: e.target.value})}
                  className={styles.formInput}
                  placeholder="Organization address"
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowCreateModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrganization}
                className={styles.submitButton}
                disabled={!createFormData.name}
              >
                Create Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && selectedOrganization && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Add User to {selectedOrganization.name}</h2>
              <button
                onClick={() => setShowAddUserModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Search Users</label>
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    if (e.target.value.length > 2) {
                      fetchAvailableUsers();
                    }
                  }}
                  className={styles.formInput}
                  placeholder="Search users by name or email"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Select User *</label>
                <select
                  value={addUserFormData.userId}
                  onChange={(e) => setAddUserFormData({...addUserFormData, userId: e.target.value})}
                  className={styles.formSelect}
                >
                  <option value="">Select a user</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Role *</label>
                <select
                  value={addUserFormData.role}
                  onChange={(e) => setAddUserFormData({...addUserFormData, role: e.target.value as any})}
                  className={styles.formSelect}
                >
                  <option value="field_agent">Field Agent</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="accountant">Accountant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Employee Code</label>
                <input
                  type="text"
                  value={addUserFormData.employeeCode}
                  onChange={(e) => setAddUserFormData({...addUserFormData, employeeCode: e.target.value})}
                  className={styles.formInput}
                  placeholder="Optional employee code"
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowAddUserModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUserToOrganization}
                className={styles.submitButton}
                disabled={!addUserFormData.userId}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Staff Modal */}
      {showStaffModal && selectedOrganization && (
        <div className={styles.modal}>
          <div className={styles.modalContent} style={{maxWidth: '800px'}}>
            <div className={styles.modalHeader}>
              <h2>{selectedOrganization.name} - Staff Members</h2>
              <button
                onClick={() => setShowStaffModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {organizationStaff.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No staff members found</p>
                </div>
              ) : (
                <div className={styles.staffList}>
                  {organizationStaff.map(staff => (
                    <div key={staff.id} className={styles.staffCard}>
                      <div className={styles.staffInfo}>
                        <div className={styles.staffName}>
                          {staff.user.firstName} {staff.user.lastName}
                        </div>
                        <div className={styles.staffEmail}>{staff.user.email}</div>
                        {staff.user.phoneNumber && (
                          <div className={styles.staffPhone}>{staff.user.phoneNumber}</div>
                        )}
                      </div>
                      <div className={styles.staffDetails}>
                        <span className={`${styles.roleBadge} ${styles[staff.role + 'Role']}`}>
                          {staff.role.replace('_', ' ').toUpperCase()}
                        </span>
                        {staff.employeeCode && (
                          <div className={styles.employeeCode}>#{staff.employeeCode}</div>
                        )}
                        <div className={styles.hiredDate}>
                          Hired: {new Date(staff.hiredAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => {
                  setSelectedOrganization(selectedOrganization);
                  setShowStaffModal(false);
                  fetchAvailableUsers();
                  setShowAddUserModal(true);
                }}
                className={styles.submitButton}
              >
                Add New User
              </button>
              <button
                onClick={() => setShowStaffModal(false)}
                className={styles.cancelButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationsPage;