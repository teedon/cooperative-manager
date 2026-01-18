import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, MoreHorizontal, CreditCard, Building2, DollarSign, Calendar, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { subscriptionsApi } from '../lib/subscriptionsApi';
import type { Subscription, SubscriptionStats } from '../lib/subscriptionsApi';
import styles from './SubscriptionsPage.module.css';

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [revenueStats, setRevenueStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled' | 'expired'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'basic' | 'premium' | 'enterprise'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);

  const pageSize = 10;

  useEffect(() => {
    loadSubscriptions();
    loadRevenueStats();
  }, [currentPage, searchTerm, statusFilter, planFilter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subscriptionsApi.getSubscriptions({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
      });
      setSubscriptions(response.subscriptions);
      setTotalPages(response.totalPages);
      setTotalSubscriptions(response.total);
      
      // Set mock revenue stats for display
      setRevenueStats({
        totalActive: response.subscriptions.filter(s => s.status === 'active').length,
        totalRevenue: response.subscriptions.reduce((sum, s) => sum + s.amount, 0),
        monthlyRevenue: response.subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0),
        planBreakdown: [],
        statusBreakdown: []
      });
    } catch (err: any) {
      console.error('Failed to load subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const loadRevenueStats = async () => {
    // Mock stats for now since API method doesn't exist
    try {
      setRevenueStats({
        totalActive: 150,
        totalRevenue: 4200000,
        monthlyRevenue: 350000,
        planBreakdown: [],
        statusBreakdown: []
      });
    } catch (err: any) {
      console.error('Failed to load revenue stats:', err);
    }
  };

  const handleStatusUpdate = async (subscriptionId: string, newStatus: 'active' | 'cancelled' | 'expired') => {
    try {
      // For now, just update the UI - API method needs to be implemented
      setSubscriptions(subscriptions.map(sub => 
        sub.id === subscriptionId ? { ...sub, status: newStatus } : sub
      ));
      console.log(`Would update subscription ${subscriptionId} status to ${newStatus}`);
    } catch (err: any) {
      console.error('Failed to update subscription status:', err);
      alert('Failed to update subscription status');
    }
  };

  const handleViewDetails = (subscriptionId: string) => {
    // Navigate to subscription details page or show details modal
    console.log('Viewing subscription details:', subscriptionId);
    // TODO: Implement subscription details view
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadSubscriptions();
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

  const getStatusBadge = (status: string | null) => {
    // Handle null/undefined status
    const safeStatus = status || 'active';
    
    let icon, className;
    switch (safeStatus) {
      case 'active':
        icon = <CheckCircle size={12} />;
        className = styles.active;
        break;
      case 'cancelled':
        icon = <XCircle size={12} />;
        className = styles.cancelled;
        break;
      case 'expired':
        icon = <Clock size={12} />;
        className = styles.expired;
        break;
      default:
        icon = <CheckCircle size={12} />;
        className = styles.active;
    }

    return (
      <span className={`${styles.statusBadge} ${className}`}>
        {icon}
        {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
      </span>
    );
  };

  const getPlanBadge = (planType: string | null, amount: number) => {
    // Handle null/undefined planType
    const safePlanType = planType || 'basic';
    
    let className;
    switch (safePlanType) {
      case 'basic':
        className = styles.basic;
        break;
      case 'premium':
        className = styles.premium;
        break;
      case 'enterprise':
        className = styles.enterprise;
        break;
      default:
        className = styles.basic;
    }

    return (
      <span className={`${styles.planBadge} ${className}`}>
        {safePlanType.charAt(0).toUpperCase() + safePlanType.slice(1)} - {formatCurrency(amount || 0)}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Subscriptions</h1>
          <p className={styles.subtitle}>Manage subscription plans and revenue tracking</p>
        </div>
        <button onClick={loadSubscriptions} className={styles.refreshButton} disabled={loading}>
          <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button onClick={loadSubscriptions} className={styles.retryButton}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* Revenue Stats */}
      <div className={styles.revenueStats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>
              {formatCurrency(revenueStats?.totalRevenue || 0)}
            </h3>
            <p className={styles.statLabel}>Total Revenue</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <CreditCard size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>
              {formatCurrency(revenueStats?.monthlyRevenue || 0)}
            </h3>
            <p className={styles.statLabel}>Monthly Revenue</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Calendar size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>
              {formatCurrency(revenueStats?.totalRevenue || 0)}
            </h3>
            <p className={styles.statLabel}>Total Revenue</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Building2 size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>
              {revenueStats?.totalActive || 0}
            </h3>
            <p className={styles.statLabel}>Active Subscriptions</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={styles.filtersSection}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInput}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search subscriptions by cooperative name..."
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
                setStatusFilter(e.target.value as 'all' | 'active' | 'cancelled' | 'expired');
                setCurrentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <select 
              value={planFilter} 
              onChange={(e) => {
                setPlanFilter(e.target.value as 'all' | 'basic' | 'premium' | 'enterprise');
                setCurrentPage(1);
              }}
            >
              <option value="all">All Plans</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{totalSubscriptions.toLocaleString()}</span>
          <span className={styles.statLabel}>Total Subscriptions</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {subscriptions.filter(s => s.status === 'active').length.toLocaleString()}
          </span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {subscriptions.filter(s => s.status === 'cancelled').length.toLocaleString()}
          </span>
          <span className={styles.statLabel}>Cancelled</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {subscriptions.filter(s => s.status === 'expired').length.toLocaleString()}
          </span>
          <span className={styles.statLabel}>Expired</span>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cooperative</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Started</th>
              <th>Next Billing</th>
              <th>Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.loadingRow}>
                  <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <span>Loading subscriptions...</span>
                  </div>
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyRow}>
                  No subscriptions found
                </td>
              </tr>
            ) : (
              subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>
                    <div className={styles.cooperativeInfo}>
                      <div className={styles.cooperativeIcon}>
                        <Building2 size={20} />
                      </div>
                      <span className={styles.cooperativeName}>
                        {subscription.cooperativeName}
                      </span>
                    </div>
                  </td>
                  <td>
                    {getPlanBadge(subscription.planType, subscription.amount)}
                  </td>
                  <td>
                    {getStatusBadge(subscription.status)}
                  </td>
                  <td>
                    <span className={styles.date}>{formatDate(subscription.startDate)}</span>
                  </td>
                  <td>
                    <span className={styles.date}>
                      {subscription.endDate ? formatDate(subscription.endDate) : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.revenueInfo}>
                      <span className={styles.monthlyRevenue}>
                        {formatCurrency(subscription.amount)}
                      </span>
                      <span className={styles.frequency}>per month</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleViewDetails(subscription.id)}
                      >
                        <Eye size={14} />
                        View
                      </button>
                      {subscription.status === 'active' && (
                        <button
                          className={`${styles.actionButton} ${styles.cancel}`}
                          onClick={() => handleStatusUpdate(subscription.id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      )}
                      {(subscription.status === 'cancelled' || subscription.status === 'expired') && (
                        <button
                          className={`${styles.actionButton} ${styles.reactivate}`}
                          onClick={() => handleStatusUpdate(subscription.id, 'active')}
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
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalSubscriptions)} of {totalSubscriptions} subscriptions
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