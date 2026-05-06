import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const fmt  = n  => Number(n  || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 });
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const STATUS = {
  draft:     { label: 'Draft',     cls: 'bg-gray-100 text-gray-600' },
  submitted: { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700' },
  approved:  { label: 'Approved',  cls: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',  cls: 'bg-red-100 text-red-600' },
  paid:      { label: 'Paid',      cls: 'bg-blue-100 text-blue-700' },
};

export default function Approvals() {
  const navigate   = useNavigate();
  const { user, hasRole } = useAuth();
  const isCFO      = hasRole('cfo', 'admin');

  const [periods,   setPeriods]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // Action state per period
  const [acting,    setActing]    = useState(null); // { month, year, type: 'approve'|'reject' }
  const [remarks,   setRemarks]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await api.get('/approvals/list');
      if (r.success) setPeriods(r.data);
      else setError(r.error || 'Failed to load');
    } catch (e) {
      setError('Failed to load: ' + (e.response?.data?.error || e.message || 'Unknown error'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending  = periods.filter(p => p.status === 'submitted');
  const history  = periods.filter(p => p.status !== 'submitted');

  const openAction = (period, type) => {
    setActing({ month: period.month, year: period.year, type });
    setRemarks('');
    setActionMsg(''); setActionErr('');
  };

  const cancelAction = () => { setActing(null); setRemarks(''); };

  const handleAction = async () => {
    if (acting.type === 'reject' && !remarks.trim()) {
      setActionErr('Reason is required for rejection.'); return;
    }
    setSaving(true); setActionErr('');
    try {
      const endpoint = acting.type === 'approve'
        ? `/approvals/approve/${acting.month}/${acting.year}`
        : `/approvals/reject/${acting.month}/${acting.year}`;
      const payload = acting.type === 'approve'
        ? { approved_by: user?.id, remarks: remarks || null }
        : { rejected_by: user?.id, remarks };
      const r = await api.post(endpoint, payload);
      if (r.success) {
        setActionMsg(r.message);
        setActing(null); setRemarks('');
        load();
      } else {
        setActionErr(r.error || 'Action failed');
      }
    } catch (e) {
      setActionErr(e.response?.data?.error || 'Action failed');
    } finally { setSaving(false); }
  };

  const handleMarkPaid = async (month, year) => {
    if (!window.confirm(`Mark ${MONTHS[month-1]} ${year} payroll as PAID? This cannot be undone.`)) return;
    try {
      const r = await api.post(`/approvals/mark-paid/${month}/${year}`, { paid_by: user?.id });
      if (r.success) { setActionMsg(r.message); load(); }
      else alert(r.error);
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">CFO Approval Workflow</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {isCFO ? 'Review and approve payroll submissions' : 'Track payroll approval status'}
        </p>
      </div>

      {/* Success message */}
      {actionMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-green-400 hover:text-green-600 ml-4">✕</button>
        </div>
      )}

      {/* Approve / Reject modal */}
      {acting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${acting.type === 'approve' ? 'bg-green-100' : 'bg-red-100'}`}>
                {acting.type === 'approve'
                  ? <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  : <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                }
              </div>
              <div>
                <p className="font-bold text-gray-900 capitalize">{acting.type} Payroll</p>
                <p className="text-sm text-gray-500">{MONTHS[acting.month - 1]} {acting.year}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {acting.type === 'approve' ? 'Remarks (optional)' : 'Reason for rejection *'}
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder={acting.type === 'approve' ? 'Add any notes...' : 'Explain why the payroll is rejected...'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {actionErr && (
              <p className="text-red-600 text-xs mb-3">{actionErr}</p>
            )}

            <div className="flex gap-3">
              <button onClick={cancelAction}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleAction} disabled={saving}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50
                  ${acting.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {saving ? 'Processing...' : acting.type === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* ── Pending Approvals ────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              {pending.length > 0 && (
                <span className="flex h-5 w-5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"/>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 items-center justify-center">
                    <span className="text-white text-xs font-bold">{pending.length}</span>
                  </span>
                </span>
              )}
              <p className="font-semibold text-gray-800">
                Pending CFO Approval
                {pending.length === 0 && <span className="text-gray-400 font-normal ml-2">— none at the moment</span>}
              </p>
            </div>

            {pending.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-sm">No payrolls awaiting approval</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pending.map((p, i) => (
                  <PeriodRow key={i} p={p} isCFO={isCFO}
                    onView={() => navigate(`/payroll/${p.month}/${p.year}`)}
                    onApprove={() => openAction(p, 'approve')}
                    onReject={()  => openAction(p, 'reject')}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Approval History ─────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="font-semibold text-gray-800">Approval History</p>
            </div>

            {history.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No history yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Period</th>
                      <th className="px-5 py-3 text-right font-medium">Employees</th>
                      <th className="px-5 py-3 text-right font-medium">Total Gross</th>
                      <th className="px-5 py-3 text-right font-medium">Total Net</th>
                      <th className="px-5 py-3 text-left font-medium">Status</th>
                      <th className="px-5 py-3 text-left font-medium">Last Updated</th>
                      <th className="px-5 py-3 text-left font-medium">Remarks</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.map((p, i) => {
                      const st = STATUS[p.status] || STATUS.draft;
                      return (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-gray-800">
                            {MONTHS[p.month - 1]} {p.year}
                          </td>
                          <td className="px-5 py-3 text-right text-gray-600">{p.employees}</td>
                          <td className="px-5 py-3 text-right font-mono text-gray-600">PKR {fmt(p.total_gross)}</td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-gray-800">PKR {fmt(p.total_net)}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs">{fmtDate(p.last_updated)}</td>
                          <td className="px-5 py-3 text-gray-500 text-xs max-w-[160px] truncate">{p.remarks || '—'}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => navigate(`/payroll/${p.month}/${p.year}`)}
                                className="text-xs text-blue-600 hover:underline font-medium">View</button>
                              {p.status === 'approved' && isCFO && (
                                <button onClick={() => handleMarkPaid(p.month, p.year)}
                                  className="text-xs text-green-600 hover:underline font-medium">Mark Paid</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PeriodRow({ p, isCFO, onView, onApprove, onReject }) {
  const fmt = n => Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 });
  return (
    <div className="px-5 py-4 flex flex-wrap items-center gap-4">
      {/* Period + stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="font-bold text-gray-900 text-base">{MONTHS[p.month - 1]} {p.year}</p>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Awaiting Approval</span>
        </div>
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
          <span><strong className="text-gray-700">{p.employees}</strong> employees</span>
          <span>Gross: <strong className="text-gray-700 font-mono">PKR {fmt(p.total_gross)}</strong></span>
          <span>Deductions: <strong className="text-red-600 font-mono">PKR {fmt(p.total_deductions)}</strong></span>
          <span>Net: <strong className="text-green-700 font-mono">PKR {fmt(p.total_net)}</strong></span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onView}
          className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
          View Details
        </button>
        {isCFO && (
          <>
            <button onClick={onReject}
              className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium">
              Reject
            </button>
            <button onClick={onApprove}
              className="px-4 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold">
              Approve
            </button>
          </>
        )}
      </div>
    </div>
  );
}
