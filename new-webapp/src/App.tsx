import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { useAppSelector } from './hooks/useAuth'
import { LoginPage, SignupPage } from './pages/auth'
import { DashboardPage } from './pages/DashboardPage'
import { CooperativeDetailsPage } from './pages/CooperativeDetailsPage'
import { LoanRequestPage } from './pages/LoanRequestPage'
import { LoansListPage } from './pages/LoansListPage'
import { LoanDetailPage } from './pages/LoanDetailPage'
import { LoanTypesPage } from './pages/LoanTypesPage'
import { ToastProvider } from './components/ui'
import './index.css'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

// App Routes Component
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:id" 
        element={
          <ProtectedRoute>
            <CooperativeDetailsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:cooperativeId/loan-types" 
        element={
          <ProtectedRoute>
            <LoanTypesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:cooperativeId/loans" 
        element={
          <ProtectedRoute>
            <LoansListPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:cooperativeId/loans/request" 
        element={
          <ProtectedRoute>
            <LoanRequestPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:cooperativeId/loans/:loanId" 
        element={
          <ProtectedRoute>
            <LoanDetailPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Default Route */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </ToastProvider>
    </Provider>
  )
}

export default App
