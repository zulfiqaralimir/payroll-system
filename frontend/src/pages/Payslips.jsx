import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const fmt = n => Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function Payslips() {
  const now  = new Date();
  const [month,    setMonth]    = useState(now.getMonth() + 1);
  const [year,     setYear]     = useState(now.getFullYear());
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [downloading, setDownloading] = useState(null); // payrollRunId being downloaded
  const [zipping,  setZipping]  = useState(false);

  const years = [];
  for (let y = now.getFullYear(); y >= 2024; y--) years.push(y);

  const loadList = useCallback(async (m, y) => {
    setLoading(true); setError(''); setRows([]);
    try {
      const r = await api.get(`/payslips/list/${m}/${y}`);
      if (r.success) setRows(r.data);
      else setError(r.error || 'Failed to load payslips');
    } catch (e) {
      setError('No payroll data for this period. Run payroll first.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadList(month, year); }, [month, year, loadList]);

  const handleMonthChange = e => { const m = Number(e.target.value); setMonth(m); };
  const handleYearChange  = e => { const y = Number(e.target.value); setYear(y); };

  const downloadPDF = async (payrollRunId, empCode, empName) => {
    setDownloading(payrollRunId);
    try {
      const period   = `${MONTHS[month - 1].slice(0, 3)}-${year}`;
      const filename = `Payslip-${empCode}-${period}.pdf`;

      // Fetch as blob directly (axios won't handle binary well for download)
      const token = localStorage.getItem('ws_token');
      const res = await fetch(`/api/payslips/pdf/${payrollRunId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Download failed: ' + e.message);
    } finally {
      setDownloading(null);
    }
  };

  const downloadZip = async () => {
    setZipping(true);
    try {
      const period   = `${MONTHS[month - 1].slice(0, 3)}-${year}`;
      const filename = `WellServe-Payslips-${period}.zip`;
      const token    = localStorage.getItem('ws_token');
      const res = await fetch(`/api/payslips/zip/${month}/${year}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('ZIP generation failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('ZIP download failed: ' + e.message);
    } finally {
      setZipping(false);
    }
  };

  const previewPayslip = (payrollRunId) => {
    window.open(`/api/payslips/preview/${payrollRunId}`, '_blank');
  };

  const filtered = rows.filter(r =>
    !search ||
    (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.employee_id_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.department_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totals = filtered.reduce((acc, r) => ({
    gross: acc.gross + Number(r.gross_salary || 0),
    deductions: acc.deductions + Number(r.total_deductions || 0),
    net: acc.net + Number(r.net_salary || 0),
  }), { gross: 0, deductions: 0, net: 0 });

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payslip Generation</h1>
          <p className="text-sm text-gray-400 mt-0.5">Generate and download PDF payslips for any payroll period</p>
        </div>

        {rows.length > 0 && (
          <button
            onClick={downloadZip}
            disabled={zipping}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-lg transition">
            {zipping
              ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>Generating ZIP...</>
              : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>Download All ({rows.length}) as ZIP</>
            }
          </button>
        )}
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
            <select value={month} onChange={handleMonthChange}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]">
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <select value={year} onChange={handleYearChange}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {rows.length > 0 && (
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Name, ID or department…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card label="Employees"        value={rows.length}                color="blue" />
          <Card label="Total Gross"      value={`PKR ${fmt(totals.gross)}`} color="green" mono />
          <Card label="Total Deductions" value={`PKR ${fmt(totals.deductions)}`} color="red" mono />
          <Card label="Total Net Pay"    value={`PKR ${fmt(totals.net)}`}   color="purple" mono />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              <span className="font-bold text-blue-600">{filtered.length}</span> payslips — {MONTHS[month - 1]} {year}
            </span>
            <span className="text-xs text-gray-400">Click Preview to view, Download to save PDF</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Employee</th>
                  <th className="px-4 py-3 text-left font-medium">Department</th>
                  <th className="px-4 py-3 text-right font-medium">Basic</th>
                  <th className="px-4 py-3 text-right font-medium">Gross</th>
                  <th className="px-4 py-3 text-right font-medium">Deductions</th>
                  <th className="px-4 py-3 text-right font-medium">Net Pay</th>
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.name}</div>
                      <div className="text-xs text-blue-600 font-mono">{r.employee_id_code}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.department_name || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500 text-xs">{fmt(r.basic_pay)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{fmt(r.gross_salary)}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-500">{fmt(r.total_deductions)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{fmt(r.net_salary)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => previewPayslip(r.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg transition bg-blue-50 hover:bg-blue-100">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                          Preview
                        </button>
                        <button
                          onClick={() => downloadPDF(r.id, r.employee_id_code, r.name)}
                          disabled={downloading === r.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white bg-[#0f1e3a] hover:bg-[#1a2f5a] disabled:bg-gray-400 rounded-lg transition">
                          {downloading === r.id
                            ? <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                              </svg>
                            : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                              </svg>
                          }
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Grand Total ({filtered.length} employees)
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-700">{fmt(totals.gross)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-red-600">{fmt(totals.deductions)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-green-700">{fmt(totals.net)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && rows.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-20 text-center">
          <svg className="w-14 h-14 mx-auto mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 font-medium">No payroll data for {MONTHS[month - 1]} {year}</p>
          <p className="text-gray-400 text-sm mt-1">Run payroll for this period first, then come back to generate payslips.</p>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, color, mono }) {
  const cls = {
    blue:   'bg-blue-50 border-blue-100 text-blue-700',
    green:  'bg-green-50 border-green-100 text-green-700',
    red:    'bg-red-50 border-red-100 text-red-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${cls[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className={`text-base font-bold mt-1 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
