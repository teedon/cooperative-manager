import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Smartphone,
  Building,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../lib/api';
import { DashboardOverview } from '../components/DashboardOverview';
import { AppManagementPage } from './AppManagementPage';
import { UsersPage } from './UsersPage';
import { CooperativesPage } from './CooperativesPage';
import { SubscriptionsPage } from './SubscriptionsPage';
import OrganizationsPage from './OrganizationsPage';
import styles from './DashboardPage.module.css';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { path: '/dashboard/users', icon: Users, label: 'Users' },
  { path: '/dashboard/cooperatives', icon: Building2, label: 'Cooperatives' },
  { path: '/dashboard/organizations', icon: Building, label: 'Organizations' },
  { path: '/dashboard/app-management', icon: Smartphone, label: 'App Management' },
  { path: '/dashboard/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { path: '/dashboard/reports', icon: FileText, label: 'Reports' },
  { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const admin = useAuthStore((state) => state.admin);
  const logout = useAuthStore((state) => state.logout);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className={styles.overlay} 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>CM</div>
            <span className={styles.logoText}>CoopManager</span>
          </div>
          <button 
            className={styles.closeSidebar}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminBadge}>Admin Portal</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <button 
            className={styles.menuButton}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className={styles.headerRight}>
            <button className={styles.notificationButton}>
              <Bell size={20} />
              <span className={styles.notificationBadge}>3</span>
            </button>

            <div className={styles.userMenu}>
              <button 
                className={styles.userMenuButton}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className={styles.avatar}>
                  {admin?.firstName?.[0]}{admin?.lastName?.[0]}
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>
                    {admin?.firstName} {admin?.lastName}
                  </span>
                  <span className={styles.userRole}>{admin?.role}</span>
                </div>
                <ChevronDown size={16} />
              </button>

              {userMenuOpen && (
                <>
                  <div 
                    className={styles.userMenuOverlay} 
                    onClick={() => setUserMenuOpen(false)} 
                  />
                  <div className={styles.userMenuDropdown}>
                    <div className={styles.userMenuHeader}>
                      <span className={styles.userMenuEmail}>{admin?.email}</span>
                    </div>
                    <button 
                      className={styles.userMenuItem}
                      onClick={handleLogout}
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.content}>
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="cooperatives" element={<CooperativesPage />} />
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="app-management" element={<AppManagementPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Placeholder component for pages not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className={styles.placeholder}>
      <h1>{title}</h1>
      <p>This page is coming soon.</p>
    </div>
  );
}
