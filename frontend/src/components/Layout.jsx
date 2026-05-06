import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ExcelImportBanner from './ExcelImportBanner';

/* ─── Navigation items per role ─── */
const NAV_ITEMS = {
  admin: [
    { to: '/dashboard',  label: 'Dashboard',     icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { to: '/master',     label: 'Database',      icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
    { to: '/employees',  label: 'Employees',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { to: '/payroll',    label: 'Payroll',       icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { to: '/payslips',   label: 'Payslips',      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { to: '/approvals',  label: 'Approvals',     icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { to: '/reports',    label: 'Reports',       icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { to: '/users',      label: 'Users',         icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  ],
  hr_manager: [
    { to: '/dashboard',  label: 'Dashboard',     icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { to: '/employees',  label: 'Employees',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { to: '/payroll',    label: 'Payroll',       icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { to: '/payslips',   label: 'Payslips',      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ],
  cfo: [
    { to: '/dashboard',  label: 'Dashboard',     icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { to: '/payroll',    label: 'Payroll (View)', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { to: '/approvals',  label: 'Approvals',     icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { to: '/reports',    label: 'Reports',       icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ],
};

const ROLE_BADGE = {
  admin:      'bg-red-100 text-red-700',
  hr_manager: 'bg-blue-100 text-blue-700',
  cfo:        'bg-purple-100 text-purple-700',
};

function NavIcon({ path }) {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = NAV_ITEMS[user?.role] || [];

  const handleLogout = async () => {
    try { await api.post('/auth/logout', { userId: user?.id }); } catch { /* ignore */ }
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ─── Sidebar ─── */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} flex-shrink-0 bg-[#0f1e3a] flex flex-col transition-all duration-200`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight">WellServe</p>
              <p className="text-blue-400 text-xs leading-tight">HR Payroll</p>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            className="ml-auto text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }>
              <NavIcon path={item.icon} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User profile at bottom */}
        <div className="border-t border-slate-700 p-3">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[user?.role] || 'bg-gray-600 text-gray-200'}`}>
                  {user?.role}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-slate-400 hover:text-red-400 transition-colors ml-auto">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-sm font-semibold text-gray-800">WellServe HR Payroll System</h1>
            <p className="text-xs text-gray-400">Wellserve Oilfield Services (Pvt) Ltd, Islamabad</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
              System Online
            </div>
            <div className="text-xs text-gray-400">
              {new Date().toLocaleDateString('en-PK', { weekday:'short', year:'numeric', month:'short', day:'numeric' })}
            </div>
          </div>
        </header>

        {/* Excel import notification banner — shown system-wide */}
        <ExcelImportBanner />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
