import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, UserPlus, BarChart3 } from 'lucide-react';
import { dashboardApi } from '../lib/dashboardApi';
import type { DashboardStats, RecentActivity } from '../lib/dashboardApi';
import styles from './DashboardOverview.module.css';

export function DashboardOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, activitiesData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentActivity(),
      ]);
      setStats(statsData);
      setActivities(activitiesData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please check your connection.');
      // Set empty state instead of mock data
      setStats({
        totalUsers: 0,
        totalCooperatives: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        userGrowth: 0,
        cooperativeGrowth: 0,
        subscriptionGrowth: 0,
        revenueGrowth: 0,
      });
      setActivities([]);
    } finally {
      setLoading(false);
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

  const formatGrowth = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_registered':
        return '👤';
      case 'cooperative_created':
        return '🏢';
      case 'subscription_upgraded':
        return '⬆️';
      case 'support_ticket':
        return '🎫';
      case 'cooperative_verified':
        return '✅';
      default:
        return '📝';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Quick action handlers
  const handleAddAdminUser = () => {
    navigate('/dashboard/users');
    // We could also trigger a modal here directly
  };

  const handleViewCooperatives = () => {
    navigate('/dashboard/cooperatives');
  };

  const handleManageSubscriptions = () => {
    navigate('/dashboard/subscriptions');
  };

  const handleViewReports = () => {
    navigate('/dashboard/reports');
  };

  // Stat card click handlers for navigation
  const handleStatCardClick = (statType: string) => {
    switch (statType) {
      case 'users':
        navigate('/dashboard/users');
        break;
      case 'cooperatives':
        navigate('/dashboard/cooperatives');
        break;
      case 'subscriptions':
        navigate('/dashboard/subscriptions');
        break;
      case 'revenue':
        navigate('/dashboard/reports');
        break;
      default:
        break;
    }
  };

  // Activity item click handler
  const handleActivityClick = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'user_registered':
        navigate('/dashboard/users');
        break;
      case 'cooperative_created':
      case 'cooperative_verified':
        navigate('/dashboard/cooperatives');
        break;
      case 'subscription_upgraded':
        navigate('/dashboard/subscriptions');
        break;
      default:
        // For support tickets or other activities, could navigate to relevant section
        break;
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const statsData = [
    {
      key: 'users',
      label: 'Total Users',
      value: stats?.totalUsers?.toLocaleString() || '0',
      change: formatGrowth(stats?.userGrowth || 0),
      trend: (stats?.userGrowth || 0) > 0 ? 'up' : 'down',
      icon: Users,
      color: 'blue',
    },
    {
      key: 'cooperatives',
      label: 'Cooperatives',
      value: stats?.totalCooperatives?.toLocaleString() || '0',
      change: formatGrowth(stats?.cooperativeGrowth || 0),
      trend: (stats?.cooperativeGrowth || 0) > 0 ? 'up' : 'down',
      icon: Building2,
      color: 'purple',
    },
    {
      key: 'subscriptions',
      label: 'Active Subscriptions',
      value: stats?.activeSubscriptions?.toLocaleString() || '0',
      change: formatGrowth(stats?.subscriptionGrowth || 0),
      trend: (stats?.subscriptionGrowth || 0) > 0 ? 'up' : 'down',
      icon: CreditCard,
      color: 'green',
    },
    {
      key: 'revenue',
      label: 'Monthly Revenue',
      value: formatCurrency(stats?.monthlyRevenue || 0),
      change: formatGrowth(stats?.revenueGrowth || 0),
      trend: (stats?.revenueGrowth || 0) > 0 ? 'up' : 'down',
      icon: TrendingUp,
      color: 'orange',
    },
  ];

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button onClick={loadDashboardData} className={styles.retryButton}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}
      
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard Overview</h1>
        <p className={styles.subtitle}>Welcome back! Here's what's happening with your platform.</p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {statsData.map((stat) => (
          <div 
            key={stat.label} 
            className={`${styles.statCard} ${styles.clickable}`}
            onClick={() => handleStatCardClick(stat.key)}
            title={`View ${stat.label.toLowerCase()}`}
          >
            <div className={styles.statHeader}>
              <div className={`${styles.statIcon} ${styles[stat.color]}`}>
                <stat.icon size={20} />
              </div>
              <div className={`${styles.statChange} ${stat.trend === 'up' ? styles.up : styles.down}`}>
                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
        {/* Recent Activity */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Activity</h2>
            <button 
              onClick={loadDashboardData} 
              className={styles.refreshButton} 
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? styles.spinning : ''} />
              Refresh
            </button>
          </div>
          <div className={styles.activityList}>
            {activities.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No recent activity</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className={`${styles.activityItem} ${styles.clickable}`}
                  onClick={() => handleActivityClick(activity)}
                  title={`View ${activity.type.replace('_', ' ')}`}
                >
                  <div className={styles.activityIcon}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityAction}>{activity.description}</p>
                    <p className={styles.activityName}>{activity.entityName}</p>
                  </div>
                  <span className={styles.activityTime}>{getTimeAgo(activity.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Quick Actions</h2>
          </div>
          <div className={styles.quickActions}>
            <button 
              className={styles.quickAction}
              onClick={handleAddAdminUser}
              title="Navigate to Users page and add admin user"
            >
              <UserPlus size={20} />
              <span>Add Admin User</span>
            </button>
            <button 
              className={styles.quickAction}
              onClick={handleViewCooperatives}
              title="View and manage cooperatives"
            >
              <Building2 size={20} />
              <span>View Cooperatives</span>
            </button>
            <button 
              className={styles.quickAction}
              onClick={handleManageSubscriptions}
              title="Manage subscription plans and billing"
            >
              <CreditCard size={20} />
              <span>Manage Subscriptions</span>
            </button>
            <button 
              className={styles.quickAction}
              onClick={handleViewReports}
              title="View analytics and reports"
            >
              <BarChart3 size={20} />
              <span>View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
