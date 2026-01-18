import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, MoreHorizontal, Building2, Users, DollarSign, CheckCircle, XCircle, Clock, MapPin, Eye } from 'lucide-react';
import { cooperativesApi } from '../lib/cooperativesApi';
import type { Cooperative } from '../lib/cooperativesApi';
import styles from './CooperativesPage.module.css';

export function CooperativesPage() {
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCooperatives, setTotalCooperatives] = useState(0);

  const pageSize = 10;

  useEffect(() => {
    loadCooperatives();
  }, [currentPage, searchTerm, statusFilter]);

  const loadCooperatives = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cooperativesApi.getCooperatives({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
      });
      setCooperatives(response.cooperatives);
      setTotalPages(response.totalPages);
      setTotalCooperatives(response.total);
    } catch (err: any) {
      console.error('Failed to load cooperatives:', err);
      setError('Failed to load cooperatives');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (cooperativeId: string, newStatus: 'active' | 'suspended' | 'pending') => {
    try {
      // For now, just update the UI - API method needs to be implemented
      setCooperatives(cooperatives.map(coop => 
        coop.id === cooperativeId ? { ...coop, status: newStatus } : coop
      ));
      console.log(`Would update cooperative ${cooperativeId} status to ${newStatus}`);
    } catch (err: any) {
      console.error('Failed to update cooperative status:', err);
      alert('Failed to update cooperative status');
    }
  };

  const handleViewDetails = (cooperativeId: string) => {
    // Navigate to cooperative details page or show details modal
    console.log('Viewing cooperative details:', cooperativeId);
    // TODO: Implement cooperative details view
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadCooperatives();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    let icon, className;
    switch (status) {
      case 'active':
        icon = <CheckCircle size={12} />;
        className = styles.active;
        break;
      case 'pending':
        icon = <Clock size={12} />;
        className = styles.pending;
        break;
      case 'suspended':
        icon = <XCircle size={12} />;
        className = styles.suspended;
        break;
      default:
        icon = <Clock size={12} />;
        className = styles.pending;
    }

    return (
      <span className={`${styles.statusBadge} ${className}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cooperatives</h1>
          <p className={styles.subtitle}>Manage and monitor all registered cooperatives</p>
        </div>
        <button onClick={loadCooperatives} className={styles.refreshButton} disabled={loading}>
          <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button onClick={loadCooperatives} className={styles.retryButton}>
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
              placeholder="Search cooperatives by name or registration number..."
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
                setStatusFilter(e.target.value as 'all' | 'active' | 'pending' | 'suspended');
                setCurrentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{totalCooperatives.toLocaleString()}</span>
          <span className={styles.statLabel}>Total Cooperatives</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {cooperatives.filter(c => c.status === 'active').length.toLocaleString()}
          </span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {cooperatives.filter(c => c.status === 'pending').length.toLocaleString()}
          </span>
          <span className={styles.statLabel}>Pending Review</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {cooperatives.reduce((sum, c) => sum + c.memberCount, 0).toLocaleString()}
          </span>
          <span className={styles.statLabel}>Total Members</span>
        </div>
      </div>

      {/* Cooperatives Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cooperative</th>
              <th>Members</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Total Savings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.loadingRow}>
                  <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <span>Loading cooperatives...</span>
                  </div>
                </td>
              </tr>
            ) : cooperatives.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  No cooperatives found
                </td>
              </tr>
            ) : (
              cooperatives.map((cooperative) => (
                <tr key={cooperative.id}>
                  <td>
                    <div className={styles.cooperativeInfo}>
                      <div className={styles.cooperativeIcon}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div className={styles.cooperativeName}>{cooperative.name}</div>
                        <div className={styles.cooperativeDetails}>
                          <span className={styles.registrationNumber}>
                            {cooperative.code}
                          </span>
                          {cooperative.organizationName && (
                            <span className={styles.location}>
                              <MapPin size={12} />
                              {cooperative.organizationName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.memberInfo}>
                      <Users size={16} />
                      <span>{cooperative.memberCount.toLocaleString()}</span>
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(cooperative.status)}
                  </td>
                  <td>
                    <span className={styles.date}>{formatDate(cooperative.createdAt)}</span>
                  </td>
                  <td>
                    <div className={styles.savingsInfo}>
                      <DollarSign size={16} />
                      <span>{formatCurrency(cooperative.totalContributions)}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleViewDetails(cooperative.id)}
                      >
                        <Eye size={14} />
                        View
                      </button>
                      {cooperative.status === 'pending' && (
                        <button
                          className={`${styles.actionButton} ${styles.approve}`}
                          onClick={() => handleStatusUpdate(cooperative.id, 'active')}
                        >
                          Approve
                        </button>
                      )}
                      {cooperative.status === 'active' && (
                        <button
                          className={`${styles.actionButton} ${styles.suspend}`}
                          onClick={() => handleStatusUpdate(cooperative.id, 'suspended')}
                        >
                          Suspend
                        </button>
                      )}
                      {cooperative.status === 'suspended' && (
                        <button
                          className={`${styles.actionButton} ${styles.reactivate}`}
                          onClick={() => handleStatusUpdate(cooperative.id, 'active')}
                        >
                          Reactivate
                        </button>
                      )}
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
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCooperatives)} of {totalCooperatives} cooperatives
        </div>
        <div className={styles.paginationControls}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}