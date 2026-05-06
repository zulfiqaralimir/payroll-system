import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MasterTables from './pages/MasterTables';
import EmployeeList from './pages/EmployeeList';
import EmployeeDetail from './pages/EmployeeDetail';
import Payroll from './pages/Payroll';
import PayrollDetail from './pages/PayrollDetail';
import Payslips from './pages/Payslips';

/* Placeholder pages for routes not yet built — coming in later phases */
function ComingSoon({ title }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-96 text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">{title}</h2>
      <p className="text-gray-400 text-sm">This module will be built in a later phase.</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes — wrapped in Layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Navigate to="/dashboard" replace />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/master" element={
          <ProtectedRoute roles={['admin', 'hr_manager']}>
            <Layout><MasterTables /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/employees" element={
          <ProtectedRoute roles={['admin', 'hr_manager']}>
            <Layout><EmployeeList /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/employees/:id" element={
          <ProtectedRoute roles={['admin', 'hr_manager']}>
            <Layout><EmployeeDetail /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/payroll" element={
          <ProtectedRoute roles={['admin', 'hr_manager', 'cfo']}>
            <Layout><Payroll /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/payroll/:month/:year" element={
          <ProtectedRoute roles={['admin', 'hr_manager', 'cfo']}>
            <Layout><PayrollDetail /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/payslips" element={
          <ProtectedRoute roles={['admin', 'hr_manager']}>
            <Layout><Payslips /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/approvals" element={
          <ProtectedRoute roles={['admin', 'cfo']}>
            <Layout><ComingSoon title="CFO Approval Workflow" /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute roles={['admin', 'cfo']}>
            <Layout><ComingSoon title="Reports & Analytics" /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute roles={['admin']}>
            <Layout><ComingSoon title="User Management" /></Layout>
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
