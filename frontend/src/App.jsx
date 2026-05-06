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
import Approvals from './pages/Approvals';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';

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
          <ProtectedRoute roles={['admin', 'cfo', 'hr_manager']}>
            <Layout><Approvals /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute roles={['admin', 'cfo', 'hr_manager']}>
            <Layout><Reports /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute roles={['admin']}>
            <Layout><UserManagement /></Layout>
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
