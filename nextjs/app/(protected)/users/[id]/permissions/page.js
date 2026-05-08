'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../../lib/AuthContext';
import api from '../../../../../lib/api';

const MODULES = [
  { key: 'dashboard',        label: 'Dashboard' },
  { key: 'employees',        label: 'Employees' },
  { key: 'salary_structures',label: 'Salary Structures' },
  { key: 'attendance',       label: 'Attendance' },
  { key: 'payroll',          label: 'Payroll' },
  { key: 'payslips',         label: 'Payslips' },
  { key: 'approvals',        label: 'Approvals' },
  { key: 'reports',          label: 'Reports' },
  { key: 'users',            label: 'Users' },
  { key: 'database',         label: 'Database' },
  { key: 'settings',         label: 'Settings' },
];

const REPORTS = [
  { key: 'monthly_summary',  label: 'Monthly Salary Summary' },
  { key: 'department_cost',  label: 'Department Cost Report' },
  { key: 'bank_transfers',   label: 'Bank Transfer List' },
  { key: 'pf_eobi',          label: 'PF & EOBI Report' },
  { key: 'tax_report',       label: 'Income Tax Report' },
  { key: 'jv_entries',       label: 'Journal Voucher (JV) Entries' },
  { key: 'ytd_report',       label: 'Year-to-Date Report' },
  { key: 'loan_recovery',    label: 'Loan Recovery Report' },
];

const PERM_KEYS   = ['can_view','can_edit','can_delete','can_approve'];
const PERM_LABELS = { can_view:'View', can_edit:'Edit', can_delete:'Delete', can_approve:'Approve' };
const PERM_COLORS = { can_view:'blue', can_edit:'green', can_delete:'red', can_approve:'purple' };

const ROLE_STYLE = { admin:'bg-red-50 text-red-700 border-red-200', hr_manager:'bg-blue-50 text-blue-700 border-blue-200', cfo:'bg-purple-50 text-purple-700 border-purple-200' };
const ROLE_LABEL = { admin:'Admin', hr_manager:'HR Manager', cfo:'CFO' };

const DEF = { can_view: false, can_edit: false, can_delete: false, can_approve: false };

export default function PermissionsPage() {
  const { user: me } = useAuth();
  const router = useRouter();
  const { id: userId } = useParams();

  const [targetUser,   setTargetUser]   = useState(null);
  const [modules,      setModules]      = useState({});
  const [departments,  setDepartments]  = useState([]);
  const [grantedDepts, setGrantedDepts] = useState([]);
  const [reports,      setReports]      = useState({});
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [msg,          setMsg]          = useState('');
  const [err,          setErr]          = useState('');

  useEffect(() => {
    if (me && me.role !== 'cfo') router.replace('/users');
  }, [me, router]);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const [uRes, mRes, dRes, rRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/permissions/${userId}`),
        api.get(`/permissions/${userId}/departments`),
        api.get(`/permissions/${userId}/reports`),
      ]);
      if (uRes.success) setTargetUser(uRes.data);
      if (mRes.success) setModules(mRes.data);
      if (dRes.success) { setDepartments(dRes.data.departments); setGrantedDepts(dRes.data.granted); }
      if (rRes.success) setReports(rRes.data);
    } catch (e) { setErr('Failed to load permissions'); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { if (userId) load(); }, [load, userId]);

  const toggleMod = (mod, key) =>
    setModules(p => ({ ...p, [mod]: { ...DEF, ...p[mod], [key]: !p[mod]?.[key] } }));

  const toggleDept = (id) =>
    setGrantedDepts(p => p.includes(id) ? p.filter(d => d !== id) : [...p, id]);

  const toggleReport = (key) =>
    setReports(p => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true); setMsg(''); setErr('');
    try {
      const [r1, r2, r3] = await Promise.all([
        api.post(`/permissions/${userId}`, modules),
        api.post(`/permissions/${userId}/departments`, { department_ids: grantedDepts }),
        api.post(`/permissions/${userId}/reports`, reports),
      ]);
      if (r1.success && r2.success && r3.success) setMsg('Permissions saved successfully.');
      else setErr('Some permissions failed to save. Please try again.');
    } catch (e) { setErr(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const adminDepts  = departments.filter(d => d.staff_type === 'admin');
  const directDepts = departments.filter(d => d.staff_type === 'direct');

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/users" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">User Permissions</h1>
          {targetUser && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-gray-500">{targetUser.name} · {targetUser.email}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_STYLE[targetUser.role] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {ROLE_LABEL[targetUser.role] || targetUser.role}
              </span>
            </div>
          )}
        </div>
        <span className="text-xs bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full font-medium">
          CFO Panel
        </span>
      </div>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex justify-between">
          <span>✓ {msg}</span>
          <button onClick={() => setMsg('')} className="text-green-400 hover:text-green-600 ml-4">✕</button>
        </div>
      )}
      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex justify-between">
          <span>{err}</span>
          <button onClick={() => setErr('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      {/* Section 1 – Module Access */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800 text-sm">Section 1 — Module Access</p>
            <p className="text-xs text-gray-500 mt-0.5">Control which modules this user can access and what they can do</p>
          </div>
          <button
            onClick={() => {
              const allOn = {};
              MODULES.forEach(m => { allOn[m.key] = { can_view: true, can_edit: false, can_delete: false, can_approve: false }; });
              setModules(allOn);
            }}
            className="text-xs text-blue-600 hover:underline font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Module</th>
                {PERM_KEYS.map(k => (
                  <th key={k} className="px-4 py-3 text-center font-medium text-gray-600 w-24">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold
                      ${k==='can_view'?'bg-blue-50 text-blue-700':
                        k==='can_edit'?'bg-green-50 text-green-700':
                        k==='can_delete'?'bg-red-50 text-red-700':
                        'bg-purple-50 text-purple-700'}`}>
                      {PERM_LABELS[k]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {MODULES.map((mod, i) => (
                <tr key={mod.key} className={`transition-colors hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                  <td className="px-5 py-3 font-medium text-gray-700">{mod.label}</td>
                  {PERM_KEYS.map(k => (
                    <td key={k} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!(modules[mod.key]?.[k])}
                        onChange={() => toggleMod(mod.key, k)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2 – Department Access */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800 text-sm">Section 2 — Department Access</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {grantedDepts.length} of {departments.length} departments selected
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setGrantedDepts(departments.map(d => d.id))}
              className="text-xs text-blue-600 hover:underline font-medium px-2 py-1 rounded hover:bg-blue-50 transition">
              Select All
            </button>
            <button onClick={() => setGrantedDepts([])}
              className="text-xs text-gray-500 hover:underline font-medium px-2 py-1 rounded hover:bg-gray-100 transition">
              Clear All
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {adminDepts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Admin Staff</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {adminDepts.map(dept => (
                  <label key={dept.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all
                      ${grantedDepts.includes(dept.id)
                        ? 'border-blue-300 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                    <input type="checkbox"
                      checked={grantedDepts.includes(dept.id)}
                      onChange={() => toggleDept(dept.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 truncate">{dept.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {directDepts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Direct (Field) Staff</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {directDepts.map(dept => (
                  <label key={dept.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all
                      ${grantedDepts.includes(dept.id)
                        ? 'border-blue-300 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                    <input type="checkbox"
                      checked={grantedDepts.includes(dept.id)}
                      onChange={() => toggleDept(dept.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 truncate">{dept.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {departments.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No departments found</p>
          )}
        </div>
      </div>

      {/* Section 3 – Report Access */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800 text-sm">Section 3 — Report Access</p>
            <p className="text-xs text-gray-500 mt-0.5">Control which reports this user can view and download</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { const all={}; REPORTS.forEach(r => { all[r.key]=true; }); setReports(all); }}
              className="text-xs text-blue-600 hover:underline font-medium px-2 py-1 rounded hover:bg-blue-50 transition">
              All Reports
            </button>
            <button onClick={() => { const none={}; REPORTS.forEach(r => { none[r.key]=false; }); setReports(none); }}
              className="text-xs text-gray-500 hover:underline font-medium px-2 py-1 rounded hover:bg-gray-100 transition">
              None
            </button>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {REPORTS.map(rep => (
            <label key={rep.key}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${reports[rep.key]
                  ? 'border-blue-300 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
              <input type="checkbox"
                checked={!!reports[rep.key]}
                onChange={() => toggleReport(rep.key)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0 cursor-pointer"
              />
              <span className="text-sm text-gray-700">{rep.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Save Bar */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
        <p className="text-xs text-gray-400">Changes take effect immediately after saving</p>
        <div className="flex gap-3">
          <Link href="/users"
            className="px-5 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
            Cancel
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition shadow-sm flex items-center gap-2">
            {saving && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            )}
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>

    </div>
  );
}
