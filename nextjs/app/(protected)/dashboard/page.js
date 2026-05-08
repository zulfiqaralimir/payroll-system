'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';
import api from '../../../lib/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PKR = n => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const STATUS_CLS = {
  draft:'bg-gray-100 text-gray-600', submitted:'bg-yellow-100 text-yellow-700',
  approved:'bg-green-100 text-green-700', rejected:'bg-red-100 text-red-600', paid:'bg-blue-100 text-blue-700',
};

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(r => { if (r.success) setStats(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ROLE_LABEL = { admin:'System Administrator', hr_manager:'HR Manager', cfo:'Chief Financial Officer' };

  return (
    <div className="p-6 space-y-6">

      <div className="bg-gradient-to-r from-[#0f1e3a] to-[#1a3a6b] rounded-xl p-6 text-white shadow">
        <p className="text-blue-300 text-sm mb-1">Welcome back,</p>
        <h2 className="text-2xl font-bold mb-0.5">{user?.name}</h2>
        <p className="text-blue-200 text-sm">{ROLE_LABEL[user?.role]} — WellServe HR Payroll</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Active Employees" value={Number(stats.activeEmployees).toLocaleString()} sub={`${stats.activeDepartments} departments`} icon={<PeopleIcon />} color="blue" />
            <SummaryCard label="Latest Month Net" value={PKR(stats.thisMonthNet)} sub={stats.thisMonthLabel ? `${stats.thisMonthEmployees} employees · ${stats.thisMonthLabel}` : 'No data yet'} icon={<MoneyIcon />} color="green" />
            <SummaryCard label="Pending Approvals" value={Number(stats.pendingApprovals) > 0 ? stats.pendingApprovals : '0'} sub={Number(stats.pendingApprovals) > 0 ? 'Awaiting CFO review' : 'All up to date'} icon={<CheckIcon />} color={Number(stats.pendingApprovals) > 0 ? 'yellow' : 'emerald'} />
            <SummaryCard label="Payroll Periods" value={stats.recentPayrolls?.length || 0} sub="Processed periods" icon={<CalIcon />} color="purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stats.monthlyTrend?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <p className="text-sm font-semibold text-gray-700 mb-4">Monthly Net Payroll Trend</p>
                <TrendChart data={stats.monthlyTrend} />
              </div>
            )}
            {stats.departmentCosts?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <p className="text-sm font-semibold text-gray-700 mb-4">Net Payroll by Department (Latest Month)</p>
                <DeptBarChart data={stats.departmentCosts} />
              </div>
            )}
          </div>

          {stats.recentPayrolls?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Recent Payroll Periods</p>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.recentPayrolls.map((p, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{MONTHS[p.month - 1]} {p.year}</span>
                      <span className="ml-2 text-xs text-gray-400">{p.employees} employees</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-gray-700">{PKR(p.total_net)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</p>
            <div className="flex flex-wrap gap-3">
              {(user?.role === 'admin' || user?.role === 'hr_manager') && (<>
                <ActionBtn label="View Employees"    onClick={() => router.push('/employees')} color="blue" />
                <ActionBtn label="Run Payroll"       onClick={() => router.push('/payroll')}   color="green" />
                <ActionBtn label="Generate Payslips" onClick={() => router.push('/payslips')}  color="teal" />
                <ActionBtn label="Database Tables"   onClick={() => router.push('/master')}    color="gray" />
              </>)}
              {(user?.role === 'admin' || user?.role === 'cfo') && (<>
                <ActionBtn label="Approvals" onClick={() => router.push('/approvals')} color="yellow" />
                <ActionBtn label="Reports"   onClick={() => router.push('/reports')}   color="purple" />
              </>)}
              {user?.role === 'hr_manager' && (
                <ActionBtn label="Approvals" onClick={() => router.push('/approvals')} color="yellow" />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-400">No data available.</div>
      )}
    </div>
  );
}

function TrendChart({ data }) {
  const max = Math.max(...data.map(d => Number(d.total_net)));
  const W = 460, H = 140, PAD = { t: 10, r: 10, b: 30, l: 60 };
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b, n = data.length;
  const xPos = i => PAD.l + (i / (n - 1 || 1)) * iW;
  const yPos = v => PAD.t + iH - (Number(v) / (max || 1)) * iH;
  const pts = data.map((d, i) => `${xPos(i)},${yPos(d.total_net)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      {[0, 0.5, 1].map(f => {
        const y = PAD.t + iH * (1 - f);
        return (<g key={f}><line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#e5e7eb" strokeWidth="1"/><text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{(max * f / 1e6).toFixed(1)}M</text></g>);
      })}
      <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round"/>
      {data.map((d, i) => (<g key={i}><circle cx={xPos(i)} cy={yPos(d.total_net)} r="3" fill="#3b82f6"/><text x={xPos(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize="9" fill="#6b7280">{MONTHS[d.month - 1]}</text></g>))}
    </svg>
  );
}

function DeptBarChart({ data }) {
  const max = Math.max(...data.map(d => Number(d.total_net)));
  const BAR_H = 22, GAP = 6, PAD_L = 130, PAD_R = 70, W = 460;
  const totalH = data.length * (BAR_H + GAP);
  return (
    <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
      <svg viewBox={`0 0 ${W} ${totalH}`} className="w-full" style={{ height: totalH }}>
        {data.map((d, i) => {
          const y = i * (BAR_H + GAP), bW = Math.max(2, ((Number(d.total_net) / max) * (W - PAD_L - PAD_R)));
          const clr = d.staff_type === 'admin' ? '#3b82f6' : '#10b981';
          return (<g key={i}><text x={PAD_L - 6} y={y + BAR_H / 2 + 4} textAnchor="end" fontSize="10" fill="#374151">{d.department.replace(' & ', '/')}</text><rect x={PAD_L} y={y} width={bW} height={BAR_H} rx="3" fill={clr} opacity="0.85"/><text x={PAD_L + bW + 4} y={y + BAR_H / 2 + 4} fontSize="10" fill="#6b7280">{(Number(d.total_net) / 1e6).toFixed(1)}M</text></g>);
        })}
      </svg>
    </div>
  );
}

function SummaryCard({ label, value, sub, icon, color }) {
  const bg = { blue:'bg-blue-50 border-blue-100', green:'bg-green-50 border-green-100', yellow:'bg-yellow-50 border-yellow-100', emerald:'bg-emerald-50 border-emerald-100', purple:'bg-purple-50 border-purple-100' };
  const ic = { blue:'text-blue-500', green:'text-green-600', yellow:'text-yellow-600', emerald:'text-emerald-600', purple:'text-purple-600' };
  return (
    <div className={`rounded-xl border p-4 ${bg[color] || bg.blue}`}>
      <div className="flex items-center justify-between mb-2"><p className="text-xs font-medium text-gray-500">{label}</p><div className={ic[color]}>{icon}</div></div>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function ActionBtn({ label, onClick, color }) {
  const cls = { blue:'border-blue-200 text-blue-700 hover:bg-blue-50', green:'border-green-200 text-green-700 hover:bg-green-50', teal:'border-teal-200 text-teal-700 hover:bg-teal-50', gray:'border-gray-200 text-gray-700 hover:bg-gray-50', yellow:'border-yellow-200 text-yellow-700 hover:bg-yellow-50', purple:'border-purple-200 text-purple-700 hover:bg-purple-50' };
  return <button onClick={onClick} className={`border rounded-lg px-4 py-2 text-sm font-medium transition-colors ${cls[color] || cls.gray}`}>{label}</button>;
}

const PeopleIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.768-.231-1.48-.634-2.071M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.768.231-1.48.634-2.071m0 0A3 3 0 1110 10a3 3 0 013 3m-3 5c0-1.032.291-1.997.804-2.817"/></svg>;
const MoneyIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const CheckIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const CalIcon   = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
