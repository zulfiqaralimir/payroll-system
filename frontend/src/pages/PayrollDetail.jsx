import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const fmt = (n) => n !== null && n !== undefined ? Number(n).toLocaleString('en-PK') : '0';

const STATUS_BADGE = {
  draft:     'bg-gray-100 text-gray-600',
  submitted: 'bg-yellow-100 text-yellow-700',
  approved:  'bg-blue-100 text-blue-700',
  rejected:  'bg-red-100 text-red-600',
  paid:      'bg-green-100 text-green-700',
};

export default function PayrollDetail() {
  const { month, year } = useParams();
  const navigate = useNavigate();

  const [rows,       setRows]      = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [err,        setErr]       = useState('');
  const [fDept,      setFDept]     = useState('');
  const [expanded,   setExpanded]  = useState(null);
  const [submitting, setSubmitting]= useState(false);
  const [submitMsg,  setSubmitMsg] = useState('');
  const [submitErr,  setSubmitErr] = useState('');

  const status = rows[0]?.status || '';
  const depts  = [...new Set(rows.map(r => r.department_name).filter(Boolean))].sort();

  useEffect(() => { fetchData(); }, [month, year]);

  const fetchData = async () => {
    setLoading(true); setErr('');
    try {
      const r = await api.get(`/payroll/${month}/${year}`);
      if (r.success) setRows(r.data);
      else setErr(r.error || 'Failed to load payroll');
    } catch {
      setErr('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true); setSubmitMsg(''); setSubmitErr('');
    try {
      const r = await api.post(`/payroll/submit/${month}/${year}`, {});
      if (r.success) { setSubmitMsg(r.message); fetchData(); }
      else setSubmitErr(r.error || 'Submit failed');
    } catch (e) {
      setSubmitErr(e.response?.data?.error || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = fDept ? rows.filter(r => r.department_name === fDept) : rows;

  const totals = filtered.reduce((acc, r) => ({
    gross: acc.gross + Number(r.gross_salary || 0),
    deductions: acc.deductions + Number(r.total_deductions || 0),
    net: acc.net + Number(r.net_salary || 0),
  }), { gross: 0, deductions: 0, net: 0 });

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );

  if (err) return (
    <div className="p-8 text-center">
      <p className="text-red-500 mb-4">{err}</p>
      <button onClick={() => navigate('/payroll')} className="text-blue-600 underline text-sm">Back to Payroll</button>
    </div>
  );

  if (rows.length === 0) return (
    <div className="p-8 text-center text-gray-400">
      <p className="text-sm">No payroll data for {MONTHS[month - 1]} {year}.</p>
      <button onClick={() => navigate('/payroll')} className="text-blue-600 underline text-sm mt-2 block mx-auto">Back to Payroll</button>
    </div>
  );

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/payroll')}
            className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {MONTHS[month - 1]} {year} — Payroll
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[status] || STATUS_BADGE.draft}`}>
                {status}
              </span>
              <span className="text-xs text-gray-400">{rows.length} employees</span>
            </div>
          </div>
        </div>

        {status === 'draft' && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition">
            {submitting
              ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>Submitting...</>
              : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>Submit for CFO Approval</>
            }
          </button>
        )}
      </div>

      {submitMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{submitMsg}</div>
      )}
      {submitErr && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{submitErr}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Employees"       value={rows.length}                  sub="processed" color="blue" />
        <SummaryCard label="Total Gross"     value={`PKR ${fmt(totals.gross)}`}   sub="before deductions" color="green" mono />
        <SummaryCard label="Total Deductions"value={`PKR ${fmt(totals.deductions)}`} sub="tax, EOBI, PF etc." color="red" mono />
        <SummaryCard label="Total Net Pay"   value={`PKR ${fmt(totals.net)}`}     sub="to be disbursed" color="purple" mono />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-500">Filter by Department:</label>
        <select value={fDept} onChange={e => setFDept(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All Departments</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {fDept && (
          <button onClick={() => setFDept('')} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Basic</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Gross</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Deductions</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Net Pay</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((r, i) => (
              <React.Fragment key={r.id || i}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{r.emp_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{r.emp_code}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.department_name || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">{fmt(r.basic_pay)}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{fmt(r.gross_salary)}</td>
                  <td className="px-4 py-3 text-right font-mono text-red-500">{fmt(r.total_deductions)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">{fmt(r.net_salary)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[r.status] || STATUS_BADGE.draft}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setExpanded(expanded === i ? null : i)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                      {expanded === i ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
                {expanded === i && (
                  <tr>
                    <td colSpan={8} className="bg-slate-50 px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                        <div>
                          <p className="font-semibold text-gray-500 uppercase tracking-widest mb-2">Earnings</p>
                          <BreakdownRow label="Basic Pay"       value={fmt(r.basic_pay)} />
                          <BreakdownRow label="House Rent"      value={fmt(r.house_rent_allowance)} />
                          <BreakdownRow label="Utility"         value={fmt(r.utility_allowance)} />
                          <BreakdownRow label="Conveyance"      value={fmt(r.conveyance_allowance)} />
                          {Number(r.overtime_amount)  > 0 && <BreakdownRow label="Overtime"     value={fmt(r.overtime_amount)} />}
                          {Number(r.rig_bonus_amount) > 0 && <BreakdownRow label="Rig Bonus"    value={fmt(r.rig_bonus_amount)} />}
                          {Number(r.travelling_amount)> 0 && <BreakdownRow label="Travelling"   value={fmt(r.travelling_amount)} />}
                          {Number(r.annual_bonus)     > 0 && <BreakdownRow label="Annual Bonus" value={fmt(r.annual_bonus)} />}
                          {Number(r.arrears)          > 0 && <BreakdownRow label="Arrears"      value={fmt(r.arrears)} />}
                          {Number(r.reimbursement)    > 0 && <BreakdownRow label="Reimb."       value={fmt(r.reimbursement)} />}
                          {Number(r.advance_salary)   > 0 && <BreakdownRow label="Advance"      value={fmt(r.advance_salary)} />}
                          {Number(r.meal_allowance)   > 0 && <BreakdownRow label="Meal Allow."  value={fmt(r.meal_allowance)} />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 uppercase tracking-widest mb-2">Deductions</p>
                          <BreakdownRow label="EOBI"            value={fmt(r.eobi)}            red />
                          <BreakdownRow label="Income Tax"      value={fmt(r.income_tax)}      red />
                          <BreakdownRow label="Provident Fund"  value={fmt(r.provident_fund)}  red />
                          {Number(r.absent_deduction) > 0 && <BreakdownRow label="Absent Days"   value={fmt(r.absent_deduction)} red />}
                          {Number(r.lwp_deduction)    > 0 && <BreakdownRow label="LWP"           value={fmt(r.lwp_deduction)}    red />}
                          {Number(r.loan_deduction)   > 0 && <BreakdownRow label="Loan"          value={fmt(r.loan_deduction)}   red />}
                          {Number(r.pf_loan)          > 0 && <BreakdownRow label="PF Loan"       value={fmt(r.pf_loan)}          red />}
                          {Number(r.other_deductions) > 0 && <BreakdownRow label="Other"         value={fmt(r.other_deductions)} red />}
                        </div>
                        <div className="md:col-span-2 flex items-start justify-end">
                          <div className="bg-white rounded-lg border border-gray-200 p-4 min-w-[200px]">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Gross Salary</span>
                              <span className="font-mono font-semibold">PKR {fmt(r.gross_salary)}</span>
                            </div>
                            <div className="flex justify-between text-xs mb-2 text-red-500">
                              <span>Total Deductions</span>
                              <span className="font-mono">- PKR {fmt(r.total_deductions)}</span>
                            </div>
                            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold">
                              <span className="text-gray-700">Net Pay</span>
                              <span className="font-mono text-green-700">PKR {fmt(r.net_salary)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
              <td className="px-4 py-3 text-sm text-gray-700" colSpan={3}>
                {fDept ? `${fDept} Total` : 'Grand Total'} ({filtered.length} employees)
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm text-gray-700">{fmt(totals.gross)}</td>
              <td className="px-4 py-3 text-right font-mono text-sm text-red-600">{fmt(totals.deductions)}</td>
              <td className="px-4 py-3 text-right font-mono text-sm text-green-700">{fmt(totals.net)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color, mono }) {
  const colors = {
    blue:   'border-blue-100 bg-blue-50 text-blue-700',
    green:  'border-green-100 bg-green-50 text-green-700',
    red:    'border-red-100 bg-red-50 text-red-700',
    purple: 'border-purple-100 bg-purple-50 text-purple-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className={`text-base font-bold mt-1 ${mono ? 'font-mono' : ''}`}>{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

function BreakdownRow({ label, value, red }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-gray-500">{label}</span>
      <span className={`font-mono ${red ? 'text-red-500' : 'text-gray-700'}`}>{value}</span>
    </div>
  );
}
