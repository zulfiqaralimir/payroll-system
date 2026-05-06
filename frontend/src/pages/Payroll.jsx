import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const STATUS_BADGE = {
  draft:     'bg-gray-100 text-gray-600',
  submitted: 'bg-yellow-100 text-yellow-700',
  approved:  'bg-blue-100 text-blue-700',
  rejected:  'bg-red-100 text-red-600',
  paid:      'bg-green-100 text-green-700',
};

const fmt = (n) => n !== null && n !== undefined ? Number(n).toLocaleString('en-PK') : '0';

export default function Payroll() {
  const navigate = useNavigate();
  const now = new Date();

  const [periods,    setPeriods]   = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [month,      setMonth]     = useState(now.getMonth() + 1);
  const [year,       setYear]      = useState(now.getFullYear());
  const [running,    setRunning]   = useState(false);
  const [runResult,  setRunResult] = useState(null);
  const [runError,   setRunError]  = useState('');

  useEffect(() => { fetchPeriods(); }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const r = await api.get('/payroll');
      if (r.success) setPeriods(r.data);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setRunning(true); setRunResult(null); setRunError('');
    try {
      const r = await api.post(`/payroll/run/${month}/${year}`, {});
      if (r.success) {
        setRunResult(r);
        fetchPeriods();
      } else {
        setRunError(r.error || 'Payroll run failed');
      }
    } catch (err) {
      setRunError(err.response?.data?.error || 'Payroll run failed');
    } finally {
      setRunning(false);
    }
  };

  const years = [];
  for (let y = now.getFullYear(); y >= 2024; y--) years.push(y);

  return (
    <div className="p-6 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Payroll Processing</h1>
        <p className="text-sm text-gray-400 mt-0.5">Run monthly payroll and manage payroll periods</p>
      </div>

      {/* Run Payroll Panel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Run Payroll</p>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]">
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2 bg-[#0f1e3a] hover:bg-[#1a2f5a] disabled:bg-gray-400 text-white text-sm font-semibold rounded-lg transition">
            {running
              ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>Calculating...</>
              : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>Run Payroll</>
            }
          </button>
        </div>

        {/* Run error */}
        {runError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {runError}
          </div>
        )}

        {/* Run result */}
        {runResult && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-green-800">
                Payroll complete — {MONTHS[month - 1]} {year}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Employees" value={runResult.processed} color="blue" />
              <StatBox label="Total Gross" value={`PKR ${fmt(runResult.totalGross)}`} color="green" />
              <StatBox label="Total Deductions" value={`PKR ${fmt(runResult.totalDeductions)}`} color="red" />
              <StatBox label="Total Net" value={`PKR ${fmt(runResult.totalNet)}`} color="purple" />
            </div>
            {runResult.errors?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-red-700 mb-1">Errors ({runResult.errors.length}):</p>
                <ul className="space-y-0.5 max-h-24 overflow-y-auto">
                  {runResult.errors.map((e, i) => (
                    <li key={i} className="text-xs text-red-600 font-mono">• {e}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => navigate(`/payroll/${month}/${year}`)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              View payroll details →
            </button>
          </div>
        )}
      </div>

      {/* Payroll History */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Payroll History</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : periods.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No payroll periods yet.</p>
            <p className="text-xs mt-1">Select a month and year above and click Run Payroll.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Period</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Employees</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Total Gross</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Total Net</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {periods.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">
                    {MONTHS[p.month - 1]} {p.year}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">{p.employees}</td>
                  <td className="px-5 py-3 text-right font-mono text-gray-600">
                    {p.total_gross ? `PKR ${fmt(p.total_gross)}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-semibold text-gray-800">
                    {p.total_net ? `PKR ${fmt(p.total_net)}` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[p.status] || STATUS_BADGE.draft}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => navigate(`/payroll/${p.month}/${p.year}`)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    green:  'bg-green-50 text-green-700 border-green-100',
    red:    'bg-red-50 text-red-700 border-red-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };
  return (
    <div className={`rounded-lg border px-4 py-3 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-sm font-bold mt-0.5 font-mono">{value}</p>
    </div>
  );
}
