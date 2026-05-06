import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ExcelImportBanner from './ExcelImportBanner';

/* ─── SVG icon helper ─── */
function NavIcon({ d }) {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
}

/* ─── All nav definitions ─── */
const NAV = [
  {
    to:    '/dashboard',
    label: 'Dashboard',
    roles: ['admin', 'hr_manager', 'cfo'],
    icon:  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    to:    '/employees',
    label: 'Employees',
    roles: ['admin', 'hr_manager'],
    icon:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    to:    '/master',
    label: 'Database',
    roles: ['admin', 'hr_manager'],
    icon:  'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
  },
  {
    to:    '/payroll',
    label: 'Payroll',
    roles: ['admin', 'hr_manager', 'cfo'],
    icon:  'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
  {
    to:    '/payslips',
    label: 'Payslips',
    roles: ['admin', 'hr_manager'],
    icon:  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    to:      '/approvals',
    label:   'Approvals',
    roles:   ['admin', 'hr_manager', 'cfo'],
    icon:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    badge:   'pending', // special: shows pending count
  },
  {
    to:    '/reports',
    label: 'Reports',
    roles: ['admin', 'hr_manager', 'cfo'],
    icon:  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    to:    '/users',
    label: 'Users',
    roles: ['admin'],
    icon:  'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
];

/* ─── Role badge styles ─── */
const ROLE_BADGE = {
  admin:      'bg-red-500/20 text-red-300',
  hr_manager: 'bg-blue-500/20 text-blue-300',
  cfo:        'bg-purple-500/20 text-purple-300',
};
const ROLE_LABEL = {
  admin:      'Admin',
  hr_manager: 'HR Manager',
  cfo:        'CFO',
};

/* ─── Page title map ─── */
const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/employees':  'Employees',
  '/master':     'Database Tables',
  '/payroll':    'Payroll',
  '/payslips':   'Payslips',
  '/approvals':  'CFO Approval Workflow',
  '/reports':    'Reports',
  '/users':      'User Management',
  '/login':      'Sign In',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed,     setCollapsed]     = useState(false);
  const [pendingCount,  setPendingCount]  = useState(0);

  /* Filter nav items for this role */
  const navItems = NAV.filter(n => n.roles.includes(user?.role));

  /* Current page title */
  const pathBase = '/' + (location.pathname.split('/')[1] || 'dashboard');
  const pageTitle = PAGE_TITLES[pathBase] || 'WellServe Payroll';

  /* Live pending approvals count */
  useEffect(() => {
    if (!user) return;
    const fetchPending = () => {
      api.get('/approvals/list').then(r => {
        if (r.success) {
          setPendingCount(r.data.filter(p => p.status === 'submitted').length);
        }
      }).catch(() => {});
    };
    fetchPending();
    const id = setInterval(fetchPending, 60_000);
    return () => clearInterval(id);
  }, [user]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout', { userId: user?.id }); } catch { /* ignore */ }
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ─── Sidebar ──────────────────────────────────────── */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} flex-shrink-0 bg-[#0f1e3a] flex flex-col transition-all duration-200 shadow-xl`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <p className="text-white font-bold text-sm leading-tight">WellServe</p>
              <p className="text-blue-400 text-xs leading-tight">HR Payroll v1.00</p>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }>
              <NavIcon d={item.icon} />
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {/* Pending badge on Approvals */}
              {item.badge === 'pending' && pendingCount > 0 && (
                <span className={`${collapsed ? 'absolute top-1 right-1' : ''} flex-shrink-0 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center`}>
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User profile */}
        <div className="border-t border-white/10 p-3">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_BADGE[user?.role] || 'bg-gray-600/30 text-gray-300'}`}>
                  {ROLE_LABEL[user?.role] || user?.role}
                </span>
              </div>
              <button onClick={handleLogout} title="Logout"
                className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <button onClick={handleLogout} title="Logout"
                className="text-slate-400 hover:text-red-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main content ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Breadcrumb */}
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{pageTitle}</h1>
              <p className="text-xs text-gray-400">WellServe Oilfield Services (Pvt) Ltd, Islamabad</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Pending approval alert */}
            {pendingCount > 0 && (
              <button onClick={() => navigate('/approvals')}
                className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs px-3 py-1.5 rounded-full font-medium hover:bg-yellow-100 transition">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse inline-block"/>
                {pendingCount} pending approval{pendingCount > 1 ? 's' : ''}
              </button>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>
              Online
            </div>
            <div className="text-xs text-gray-400">
              {new Date().toLocaleDateString('en-PK', { weekday:'short', year:'numeric', month:'short', day:'numeric' })}
            </div>
          </div>
        </header>

        {/* Excel import notification */}
        <ExcelImportBanner />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
