import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PKR = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(r => { if (r.success) setStats(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ROLE_LABEL = { admin: 'System Administrator', hr_manager: 'HR Manager', cfo: 'Chief Financial Officer' };

  return (
    <div className="p-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#0f1e3a] to-[#1a3a6b] rounded-xl p-6 mb-6 text-white shadow">
        <p className="text-blue-300 text-sm mb-1">Welcome back,</p>
        <h2 className="text-2xl font-bold mb-0.5">{user?.name}</h2>
        <p className="text-blue-200 text-sm">{ROLE_LABEL[user?.role]} — WellServe HR Payroll</p>
      </div>

      {/* Stats cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Active Employees"  value={stats?.activeEmployees  || 0} color="blue"   suffix="" />
            <StatCard label="Departments"       value={stats?.activeDepartments|| 0} color="green"  suffix="" />
            <StatCard label="Payroll Runs"      value={stats?.recentPayrolls?.length || 0} color="purple" suffix=" months" />
            <StatCard label="System Status"     value="Online" color="emerald" isText />
          </div>

          {/* Recent payrolls */}
          {stats?.recentPayrolls?.length > 0 && (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Payroll Runs</h3>
              <div className="space-y-2">
                {stats.recentPayrolls.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-gray-800">
                        {new Date(p.year, p.month - 1).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">{p.employees} employees</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-gray-700">{PKR(p.total_net)}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions by role */}
          <div className="mt-6 bg-white rounded-xl shadow border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              {(user?.role === 'admin' || user?.role === 'hr_manager') && (
                <>
                  <QuickAction label="View Employees"  onClick={() => navigate('/employees')} color="blue" />
                  <QuickAction label="Run Payroll"     onClick={() => navigate('/payroll')}   color="green" />
                  <QuickAction label="Database Tables" onClick={() => navigate('/master')}    color="gray" />
                </>
              )}
              {(user?.role === 'admin' || user?.role === 'cfo') && (
                <>
                  <QuickAction label="Approvals"  onClick={() => navigate('/approvals')} color="purple" />
                  <QuickAction label="Reports"    onClick={() => navigate('/reports')}   color="orange" />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color, suffix = '', isText = false }) {
  const colors = {
    blue:    'bg-blue-50 text-blue-700 border-blue-100',
    green:   'bg-green-50 text-green-700 border-green-100',
    purple:  'bg-purple-50 text-purple-700 border-purple-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    orange:  'bg-orange-50 text-orange-700 border-orange-100',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.blue}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className={`font-bold ${isText ? 'text-lg' : 'text-2xl'}`}>{value}{suffix}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { draft:'bg-yellow-100 text-yellow-700', submitted:'bg-blue-100 text-blue-700',
                   approved:'bg-green-100 text-green-700', rejected:'bg-red-100 text-red-600', paid:'bg-emerald-100 text-emerald-700' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

function QuickAction({ label, onClick, color }) {
  const colors = {
    blue:   'border-blue-200 text-blue-700 hover:bg-blue-50',
    green:  'border-green-200 text-green-700 hover:bg-green-50',
    gray:   'border-gray-200 text-gray-700 hover:bg-gray-50',
    purple: 'border-purple-200 text-purple-700 hover:bg-purple-50',
    orange: 'border-orange-200 text-orange-700 hover:bg-orange-50',
  };
  return (
    <button onClick={onClick}
      className={`border rounded-lg px-4 py-2 text-sm font-medium transition-colors ${colors[color] || colors.gray}`}>
      {label}
    </button>
  );
}
