import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './Login'
import { ErrorBoundary } from './components/ErrorBoundry'
import Dashboard from './pages/Dashboard.tsx'
import { Layout } from '../src/components/Layout'
import { ProtectedRoute } from '../src/components/ProtectedRoutes'
import AddEmployee from './pages/AddEmployee.tsx'
import LeaveRequestsGrid from './pages/LeavePage.tsx'
import EachEmployeeDetail from './pages/EachEmployeeDetail.tsx'
import PayrollTable from './components/PayrollLayout.tsx'
import EmployeeDashboard from './pages/EmployeeDashboard.tsx'
import EditEmployee from './pages/EditEmployee.tsx'

const App = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes with Layout */}
          <Route element={<Layout />}>
            <Route path="dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="employees" element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            <Route path="/add-employee" element={
              <ProtectedRoute>
                <AddEmployee />
              </ProtectedRoute>
            } />
            <Route path="/leaves" element={
              <ProtectedRoute>
                <LeaveRequestsGrid />
              </ProtectedRoute>
            } />
            <Route path="/employee/:id" element={
  <ProtectedRoute>
    <EachEmployeeDetail />
  </ProtectedRoute>
} />
            <Route path="/edit-employee/:id" element={<EditEmployee />} />
            <Route path="payroll" element={
              <ProtectedRoute>
                <PayrollTable />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App