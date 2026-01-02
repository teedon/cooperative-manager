import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { useAppSelector } from './hooks/useAuth'
import { LoginPage, SignupPage } from './pages/auth'
import { LandingPage } from './pages/LandingPage'
import { DownloadStatsPage } from './pages/DownloadStatsPage'
import { DashboardPage } from './pages/DashboardPage'
import { PendingApprovalsPage } from './pages/PendingApprovalsPage'
import { CooperativeDetailsPage } from './pages/CooperativeDetailsPage'
import { LoanRequestPage } from './pages/LoanRequestPage'
import { LoansListPage } from './pages/LoansListPage'
import { LoanDetailPage } from './pages/LoanDetailPage'
import { LoanTypesPage } from './pages/LoanTypesPage'
import ExpensesListPage from './pages/ExpensesListPage'
import ExpenseDetailPage from './pages/ExpenseDetailPage'
import CreateExpensePage from './pages/CreateExpensePage'
import { ContributionPlansPage } from './pages/ContributionPlansPage'
import { CreateContributionPlanPage } from './pages/CreateContributionPlanPage'
import { ContributionPlanDetailPage } from './pages/ContributionPlanDetailPage'
import { AdminManagementPage } from './pages/AdminManagementPage'
import { CooperativeSettingsPage } from './pages/CooperativeSettingsPage'
import { BulkApproveSchedulesPage } from './pages/BulkApproveSchedulesPage'
import { ReportsPage } from './pages/ReportsPage'
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
      
      {/* Public Download Stats - accessible to all */}
      <Route path="/download-stats" element={<DownloadStatsPage />} />
      
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
        path="/pending-approvals" 
        element={
          <ProtectedRoute>
            <PendingApprovalsPage />
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
      <Route 
        path="/cooperatives/:id/expenses" 
        element={
          <ProtectedRoute>
            <ExpensesListPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:id/expenses/create" 
        element={
          <ProtectedRoute>
            <CreateExpensePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:id/expenses/:expenseId" 
        element={
          <ProtectedRoute>
            <ExpenseDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:id/contributions" 
        element={
          <ProtectedRoute>
            <ContributionPlansPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:id/contributions/create" 
        element={
          <ProtectedRoute>
            <CreateContributionPlanPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:id/contributions/:planId" 
        element={
          <ProtectedRoute>
            <ContributionPlanDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:id/settings" 
        element={
          <ProtectedRoute>
            <CooperativeSettingsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:id/bulk-approve-schedules" 
        element={
          <ProtectedRoute>
            <BulkApproveSchedulesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:id/admin-management" 
        element={
          <ProtectedRoute>
            <AdminManagementPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cooperatives/:id/reports" 
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
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
