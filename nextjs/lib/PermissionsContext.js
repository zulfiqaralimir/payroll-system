'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from './api';

const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const r = await api.get('/permissions/me');
      if (r.success) setPermissions(r.data);
    } catch {}
    finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) refresh();
    else setPermissions(null);
  }, [isAuthenticated, refresh]);

  const canView = useCallback((module) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (permissions?.departments === 'all') return true; // shouldn't happen for non-admin but safety
    return permissions?.modules?.[module]?.can_view || false;
  }, [user, permissions]);

  const canEdit = useCallback((module) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions?.modules?.[module]?.can_edit || false;
  }, [user, permissions]);

  const canDelete = useCallback((module) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions?.modules?.[module]?.can_delete || false;
  }, [user, permissions]);

  const canApprove = useCallback((module) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions?.modules?.[module]?.can_approve || false;
  }, [user, permissions]);

  const hasDeptAccess = useCallback((deptId) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const depts = permissions?.departments;
    if (depts === 'all') return true;
    return Array.isArray(depts) && depts.includes(Number(deptId));
  }, [user, permissions]);

  const canViewReport = useCallback((reportName) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions?.reports?.[reportName] || false;
  }, [user, permissions]);

  return (
    <PermissionsContext.Provider value={{
      permissions, loading, refresh,
      canView, canEdit, canDelete, canApprove,
      hasDeptAccess, canViewReport,
    }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be inside PermissionsProvider');
  return ctx;
}
