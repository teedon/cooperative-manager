import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, MoreHorizontal, Mail, Phone, User as UserIcon, CheckCircle, XCircle, UserPlus, Eye } from 'lucide-react';
import { usersApi } from '../lib/usersApi';
import type { User as UserType, AdminUser, CreateAdminUserData } from '../lib/usersApi';
import styles from './UsersPage.module.css';

export function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrenPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showAdminUsersModal, setShowAdminUsersModal] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminFormData, setAdminFormData] = useState<CreateAdminUserData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'admin'
  });
  const [adminFormLoading, setAdminFormLoading] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getUsers({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setUsers(response.users);
      setTotalPages(response.totalPages);
      setTotalUsers(response.total);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      // For now, just update the UI - API method needs to be implemented
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      console.log(`Would update user ${userId} status to ${newStatus}`);
    } catch (err: any) {
      console.error('Failed to update user status:', err);
      alert('Failed to update user status');
    }
  };

  const loadAdminUsers = async () => {
    try {
      setAdminUsersLoading(true);
      const response = await usersApi.getAdminUsers({ page: 1, limit: 50 });
      setAdminUsers(response.admins);
    } catch (err: any) {
      console.error('Failed to load admin users:', err);
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const handleCreateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAdminFormLoading(true);
      await usersApi.createAdminUser(adminFormData);
      setShowAddAdminModal(false);
      setAdminFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'admin'
      });
      alert('Admin user created successfully!');
    } catch (err: any) {
      console.error('Failed to create admin user:', err);
      alert('Failed to create admin user: ' + (err.response?.data?.message || err.message));
    } finally {
      setAdminFormLoading(false);
    }
  };

  const handleViewUser = (userId: string) => {
    // Navigate to user details page or show user details modal
    console.log('Viewing user:', userId);
    // TODO: Implement user details view
  };

  const handleAdminStatusUpdate = async (adminId: string, newStatus: 'active' | 'inactive') => {
    try {
      await usersApi.updateAdminStatus(adminId, newStatus);
      setAdminUsers(adminUsers.map(admin => 
        admin.id === adminId ? { ...admin, isActive: newStatus === 'active' } : admin
      ));
    } catch (err: any) {
      console.error('Failed to update admin status:', err);
      alert('Failed to update admin status');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrenPage(1);
    loadUsers();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === 'active';
    return (
      <span className={`${styles.statusBadge} ${isActive ? styles.active : styles.inactive}`}>
        {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.subtitle}>Manage and monitor all platform users</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            onClick={() => {
              setShowAdminUsersModal(true);
              loadAdminUsers();
            }}
            className={styles.secondaryButton}
          >
            <Eye size={16} />
            View Admin Users
          </button>
          <button 
            onClick={() => setShowAddAdminModal(true)}
            className={styles.primaryButton}
          >
            <UserPlus size={16} />
            Add Admin User
          </button>
          <button onClick={loadUsers} className={styles.refreshButton} disabled={loading}>
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button onClick={loadUsers} className={styles.retryButton}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className={styles.filtersSection}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInput}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <select 
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                setCurrenPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{totalUsers.toLocaleString()}</span>
          <span className={styles.statLabel}>Total Users</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {users.filter(u => u.status === 'active').length.toLocaleString()}
          </span>
          <span className={styles.statLabel}>Active Users</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length.toLocaleString()}
          </span>
          <span className={styles.statLabel}>New This Month</span>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className={styles.loadingRow}>
                  <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <span>Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <div className={styles.userName}>{user.firstName} {user.lastName}</div>
                        <div className={styles.userRole}>User</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.contactInfo}>
                      <div className={styles.contactItem}>
                        <Mail size={14} />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className={styles.contactItem}>
                          <Phone size={14} />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(user.status)}
                  </td>
                  <td>
                    <span className={styles.date}>{formatDate(user.createdAt)}</span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleViewUser(user.id)}
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleStatusUpdate(
                          user.id,
                          user.status === 'active' ? 'inactive' : 'active'
                        )}
                      >
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className={styles.moreActions}>
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
        </div>
        <div className={styles.paginationControls}>
          <button
            onClick={() => setCurrenPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrenPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Add Admin User Modal */}
      {showAddAdminModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddAdminModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Admin User</h3>
              <button 
                onClick={() => setShowAddAdminModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateAdminUser} className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    value={adminFormData.firstName}
                    onChange={(e) => setAdminFormData({ ...adminFormData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    value={adminFormData.lastName}
                    onChange={(e) => setAdminFormData({ ...adminFormData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={adminFormData.password}
                  onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={adminFormData.role}
                  onChange={(e) => setAdminFormData({ ...adminFormData, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              
              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={() => setShowAddAdminModal(false)}
                  className={styles.cancelButton}
                  disabled={adminFormLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={adminFormLoading}
                >
                  {adminFormLoading ? 'Creating...' : 'Create Admin User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Admin Users Modal */}
      {showAdminUsersModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAdminUsersModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Admin Users</h3>
              <button 
                onClick={() => setShowAdminUsersModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {adminUsersLoading ? (
                <div className={styles.loading}>
                  <div className={styles.spinner} />
                  <span>Loading admin users...</span>
                </div>
              ) : (
                <div className={styles.adminUsersTable}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((admin) => (
                        <tr key={admin.id}>
                          <td>
                            <div className={styles.userInfo}>
                              <div className={styles.userAvatar}>
                                <UserIcon size={20} />
                              </div>
                              <div>
                                <div className={styles.userName}>{admin.firstName} {admin.lastName}</div>
                                <div className={styles.userRole}>Administrator</div>
                              </div>
                            </div>
                          </td>
                          <td>{admin.email}</td>
                          <td>
                            <span className={styles.roleBadge}>{admin.role}</span>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${admin.isActive ? styles.active : styles.inactive}`}>
                              {admin.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {admin.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString() : 'Never'}
                          </td>
                          <td>
                            <button
                              className={styles.actionButton}
                              onClick={() => handleAdminStatusUpdate(
                                admin.id,
                                admin.isActive ? 'inactive' : 'active'
                              )}
                            >
                              {admin.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {adminUsers.length === 0 && (
                    <div className={styles.emptyState}>
                      <p>No admin users found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}