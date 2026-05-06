import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-sm">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Access Denied</h2>
          <p className="text-sm text-gray-500">Your role ({user.role}) does not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
}
