'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/AuthContext';
import api from '../../../lib/api';

const ROLES = ['admin', 'hr_manager', 'cfo'];
const ROLE_STYLE = {
  admin:      'bg-red-50 text-red-700 border-red-200',
  hr_manager: 'bg-blue-50 text-blue-700 border-blue-200',
  cfo:        'bg-purple-50 text-purple-700 border-purple-200',
};
const ROLE_LABEL = { admin: 'Admin', hr_manager: 'HR Manager', cfo: 'CFO' };
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const EMPTY = { name: '', email: '', role: 'hr_manager' };

export default function UserManagement() {
  const { user: me } = useAuth();

  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [msg,     setMsg]     = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await api.get('/users');
      if (r.success) setUsers(r.data);
      else setError(r.error || 'Failed to load users');
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setFormErr(''); setShowForm(true); };
  const openEdit   = (u) => { setEditing(u.id); setForm({ name: u.name, email: u.email, role: u.role }); setFormErr(''); setShowForm(true); };
  const closeForm  = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { setFormErr('Name and email are required.'); return; }
    setSaving(true); setFormErr('');
    try {
      const r = editing ? await api.put(`/users/${editing}`, form) : await api.post('/users', form);
      if (r.success) { setMsg(r.message); closeForm(); load(); }
      else setFormErr(r.error || 'Save failed');
    } catch (e) {
      setFormErr(e.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (u) => {
    if (!window.confirm(`Deactivate user "${u.name}"? They will lose access immediately.`)) return;
    try {
      const r = await api.del(`/users/${u.id}`);
      if (r.success) { setMsg(r.message); load(); }
      else alert(r.error);
    } catch (e) { alert(e.message || 'Failed'); }
  };

  const active   = users.filter(u => u.is_active);
  const inactive = users.filter(u => !u.is_active);

  return (
    <div className="p-6 space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {me?.role === 'cfo' ? 'Manage user permissions' : 'Manage system users and their roles'}
          </p>
        </div>
        {me?.role === 'admin' && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Add User
          </button>
        )}
      </div>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-green-400 hover:text-green-600">✕</button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Muhammad Ali"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@wellserve.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              </div>
              {!editing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
                  Default password will be set to <strong>Admin@123</strong>. Ask the user to change it after first login.
                </div>
              )}
              {formErr && <p className="text-red-600 text-xs">{formErr}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeForm}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="font-semibold text-gray-800">Active Users <span className="ml-2 text-xs font-normal text-gray-400">({active.length})</span></p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Last Login</th>
                  <th className="px-5 py-3 text-left">Created</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {active.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{u.name}</span>
                        {u.id === me?.id && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">you</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_STYLE[u.role] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {ROLE_LABEL[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{fmtDate(u.last_login)}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{fmtDate(u.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {me?.role === 'admin' && (
                          <button onClick={() => openEdit(u)} className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
                        )}
                        {me?.role === 'admin' && u.id !== me?.id && (
                          <button onClick={() => handleDeactivate(u)} className="text-xs text-red-500 hover:underline font-medium">Deactivate</button>
                        )}
                        {me?.role === 'cfo' && (
                          <Link href={`/users/${u.id}/permissions`}
                            className="flex items-center gap-1 text-xs text-purple-600 hover:underline font-medium">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Permissions
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inactive.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="font-semibold text-gray-500 text-sm">Deactivated Users <span className="ml-2 text-xs font-normal text-gray-400">({inactive.length})</span></p>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  {inactive.map(u => (
                    <tr key={u.id} className="opacity-60">
                      <td className="px-5 py-3 font-medium text-gray-500">{u.name}</td>
                      <td className="px-5 py-3 text-gray-400">{u.email}</td>
                      <td className="px-5 py-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{ROLE_LABEL[u.role]}</span></td>
                      <td className="px-5 py-3 text-gray-400 text-xs" colSpan={3}>Deactivated</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
