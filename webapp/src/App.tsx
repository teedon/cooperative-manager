import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { fetchProfile } from '@/store/slices/authSlice';
import { ProtectedRoute } from '@/components/auth';
import { MainLayout } from '@/components/layout';
import { Spinner } from '@/components/common';
import './index.css';

// Pages
import { LoginPage, SignupPage } from '@/pages/auth';
import { DashboardPage } from '@/pages/home';
import { CooperativeListPage } from '@/pages/cooperative';

// Placeholder pages for routes
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-[#0F172A]">{title}</h2>
      <p className="text-[#64748B] mt-2">Coming soon...</p>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading: loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check for existing auth token and fetch profile
    const token = localStorage.getItem('accessToken');
    if (token && !isAuthenticated) {
      dispatch(fetchProfile());
    }
  }, [dispatch, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/cooperatives"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CooperativeListPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/cooperatives/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Cooperative Details" />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/cooperatives/new"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Create Cooperative" />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/contributions"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Contributions" />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/loans"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Loans" />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/group-buys"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Group Buys" />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ledger"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Ledger" />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Profile" />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Settings" />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
};

export default App;
