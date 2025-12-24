import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Wallet,
  ShoppingBag,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  User,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { logout } from '@/store/slices/authSlice';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`
      flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
      ${isActive
        ? 'bg-[--color-primary-main] text-white'
        : 'text-[--color-text-secondary] hover:bg-[--color-secondary-main] hover:text-[--color-primary-main]'
      }
    `}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: <Home className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/cooperatives', icon: <Users className="w-5 h-5" />, label: 'Cooperatives' },
    { to: '/contributions', icon: <Wallet className="w-5 h-5" />, label: 'Contributions' },
    { to: '/loans', icon: <BookOpen className="w-5 h-5" />, label: 'Loans' },
    { to: '/group-buys', icon: <ShoppingBag className="w-5 h-5" />, label: 'Group Buys' },
    { to: '/ledger', icon: <BarChart3 className="w-5 h-5" />, label: 'Ledger' },
  ];

  return (
    <div className="min-h-screen bg-[--color-background]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-[--color-surface] border-r border-[--color-border-light]
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[--color-border-light]">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[--color-primary-main] rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-[--color-text-primary]">
                CoopManager
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-[--color-secondary-main]"
            >
              <X className="w-5 h-5 text-[--color-text-secondary]" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                isActive={location.pathname.startsWith(item.to)}
                onClick={() => setSidebarOpen(false)}
              />
            ))}
          </nav>

          {/* Settings & Logout */}
          <div className="px-4 py-4 border-t border-[--color-border-light] space-y-1">
            <NavItem
              to="/settings"
              icon={<Settings className="w-5 h-5" />}
              label="Settings"
              isActive={location.pathname === '/settings'}
              onClick={() => setSidebarOpen(false)}
            />
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-[--color-error-main] hover:bg-[--color-error-light] transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-[--color-surface] border-b border-[--color-border-light]">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-secondary-main)]"
            >
              <Menu className="w-6 h-6 text-[var(--color-text-secondary)]" />
            </button>

            {/* Search - can be added later */}
            <div className="hidden lg:block" />

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-[var(--color-secondary-main)]">
                <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-error-main)] rounded-full" />
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[var(--color-secondary-main)]"
                >
                  <div className="w-8 h-8 bg-[var(--color-primary-light)] rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-[var(--color-primary-main)]" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-[--color-text-primary]">
                    {/* Use user?.email or fallback */}
                    {user?.email || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] rounded-lg shadow-lg border border-[var(--color-border-light)] py-1">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-secondary-main)]"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-secondary-main)]"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                    <hr className="my-1 border-[var(--color-border-light)]" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-[var(--color-error-main)] hover:bg-[var(--color-error-light)]"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
