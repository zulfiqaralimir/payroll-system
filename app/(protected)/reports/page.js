'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import api from '../../../lib/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const NOW = new Date();
const PKR = n => Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const TABS = [
  { id: 'summary', label: 'Payroll Summary'  },
  { id: 'dept',    label: 'Department Cost'  },
  { id: 'bank',    label: 'Bank Transfers'   },
  { id: 'pfeobi',  label: 'PF / EOBI'        },
  { id: 'tax',     label: 'Tax Deductions'   },
  { id: 'jv',      label: 'Journal Voucher'  },
];

export default function Reports() {
  const [tab,     setTab]     = useState('summary');
  const [month,   setMonth]   = useState(NOW.getMonth() + 1);
  const [year,    setYear]    = useState(NOW.getFullYear());
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const years = [];
  for (let y = 2024; y <= NOW.getFullYear() + 1; y++) years.push(y);

  const load = useCallback(async (tabId) => {
    setLoading(true); setError(''); setData(null);
    const t = tabId || tab;
    const endpoint = {
      summary: `/reports/monthly/${month}/${year}`,
      dept:    `/reports/monthly/${month}/${year}`,
      bank:    `/reports/bank-transfers/${month}/${year}`,
      pfeobi:  `/reports/pf-eobi/${month}/${year}`,
      tax:     `/reports/tax/${month}/${year}`,
      jv:      `/reports/jv/${month}/${year}`,
    }[t];
    try {
      const r = await api.get(endpoint);
      if (r.success) setData(r);
      else setError(r.error || 'Failed to load');
    } catch (e) {
      setError(e.message || 'Failed to load report');
    } finally { setLoading(false); }
  }, [tab, month, year]);

  const switchTab = (id) => { setTab(id); setData(null); setError(''); };

  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    if (tab === 'summary' || tab === 'dept') {
      const rows = (data.data?.byDepartment || []).map(d => ({
        Department:    d.department,
        'Staff Type':  d.staff_type,
        Employees:     d.employees,
        'Gross (PKR)': Number(d.total_gross),
        'Net (PKR)':   Number(d.total_net),
        'EOBI (PKR)':  Number(d.total_eobi),
        'PF (PKR)':    Number(d.total_pf),
        'Tax (PKR)':   Number(d.total_tax),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'By Department');
    }
    if (tab === 'bank') {
      const rows = (data.data || []).map(r => ({
        'Emp ID':       r.emp_code,
        Employee:       r.emp_name,
        Department:     r.department_name,
        Bank:           r.bank_name,
        'Account No':   r.bank_account,
        'Amount (PKR)': Number(r.amount),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Bank Transfers');
    }
    if (tab === 'pfeobi') {
      const rows = (data.data || []).map(r => ({
        'Emp ID':            r.emp_code,
        Employee:            r.emp_name,
        Department:          r.department_name,
        'PF Employee (PKR)': Number(r.pf_employee_share),
        'PF Employer (PKR)': Number(r.pf_employer_share),
        'PF Total (PKR)':    Number(r.pf_total),
        'EOBI Emp (PKR)':    Number(r.eobi_employee_share),
        'EOBI Empr (PKR)':   Number(r.eobi_employer_share),
        'EOBI Total (PKR)':  Number(r.eobi_total),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'PF-EOBI');
    }
    if (tab === 'tax') {
      const rows = (data.data || []).map(r => ({
        'Emp ID':      r.emp_code,
        Employee:      r.emp_name,
        CNIC:          r.cnic,
        Department:    r.department,
        'Basic (PKR)': Number(r.basic_pay),
        'Gross (PKR)': Number(r.gross_salary),
        'Monthly Tax': Number(r.income_tax),
        'Annual Proj': Number(r.annual_tax_projection),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Tax Deductions');
    }
    if (tab === 'jv') {
      const rows = (data.data || []).map(r => ({
        Txn:             r.transaction_no,
        'Account Code':  r.account_code,
        Description:     r.description,
        Department:      r.department_name,
        'Debit (PKR)':   Number(r.debit_amount),
        'Credit (PKR)':  Number(r.credit_amount),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'JV Entries');
    }

    XLSX.writeFile(wb, `WellServe_${tab}_${MONTHS[month-1]}_${year}.xlsx`);
  };

  return (
    <div className="p-6 space-y-5">

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Payroll analysis, bank transfers, PF/EOBI, JV entries</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => load()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition">
            Load Report
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => switchTab(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap
              ${tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {data && (
        <div className="flex gap-2 justify-end print:hidden">
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 px-4 py-2 border border-green-300 text-green-700 text-sm rounded-lg hover:bg-green-50 transition font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export Excel
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            Print
          </button>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      )}

      {!loading && !error && !data && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-16 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p className="text-sm">Select a period and click <strong>Load Report</strong></p>
        </div>
      )}

      {!loading && data && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">
              {TABS.find(t => t.id === tab)?.label} — {MONTHS[month-1]} {year}
            </p>
          </div>
          {tab === 'summary' && <SummaryReport data={data} />}
          {tab === 'dept'    && <DeptReport    data={data} />}
          {tab === 'bank'    && <BankReport    data={data} />}
          {tab === 'pfeobi'  && <PfEobiReport  data={data} />}
          {tab === 'tax'     && <TaxReport     data={data} />}
          {tab === 'jv'      && <JvReport      data={data} />}
        </div>
      )}
    </div>
  );
}

function SummaryReport({ data }) {
  const s = data.data?.summary || {};
  const rows = [
    ['Basic Pay',             s.total_basic],
    ['House Rent Allowance',  s.total_hra],
    ['Utility Allowance',     s.total_utility],
    ['Conveyance Allowance',  s.total_conveyance],
    ['Overtime Amount',       s.total_overtime],
    ['Rig Bonus',             s.total_rig_bonus],
    ['Travelling Amount',     s.total_travelling],
    ['Annual Bonus',          s.total_annual_bonus],
    ['Arrears',               s.total_arrears],
    ['Reimbursements',        s.total_reimbursement],
  ];
  const dedRows = [
    ['EOBI',            s.total_eobi],
    ['Income Tax',      s.total_tax],
    ['Provident Fund',  s.total_pf],
    ['Loan Deductions', s.total_loans],
    ['Absent Deduction',s.total_absent_ded],
  ];
  return (
    <div className="p-5">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Kpi label="Employees"   value={s.total_employees} />
        <Kpi label="Total Gross" value={`PKR ${PKR(s.total_gross)}`} />
        <Kpi label="Total Net"   value={`PKR ${PKR(s.total_net)}`} big />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Earnings Breakdown</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {rows.filter(([,v]) => Number(v) > 0).map(([label, val]) => (
                <tr key={label} className="hover:bg-gray-50">
                  <td className="py-2 text-gray-600">{label}</td>
                  <td className="py-2 text-right font-mono text-gray-800">PKR {PKR(val)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 font-semibold">
                <td className="py-2 text-gray-800">Total Gross</td>
                <td className="py-2 text-right font-mono text-gray-900">PKR {PKR(s.total_gross)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Deductions Breakdown</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {dedRows.filter(([,v]) => Number(v) > 0).map(([label, val]) => (
                <tr key={label} className="hover:bg-gray-50">
                  <td className="py-2 text-gray-600">{label}</td>
                  <td className="py-2 text-right font-mono text-red-600">PKR {PKR(val)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 font-semibold">
                <td className="py-2 text-gray-800">Total Deductions</td>
                <td className="py-2 text-right font-mono text-red-700">PKR {PKR(s.total_deductions)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4 bg-[#0f1e3a] rounded-lg px-4 py-3 text-white flex justify-between items-center">
            <span className="text-sm font-semibold">NET PAYABLE</span>
            <span className="text-lg font-bold font-mono">PKR {PKR(s.total_net)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeptReport({ data }) {
  const rows    = data.data?.byDepartment || [];
  const byType  = data.data?.byStaffType  || [];
  const grandNet = rows.reduce((a, r) => a + Number(r.total_net), 0);
  return (
    <div className="overflow-x-auto">
      {byType.length > 0 && (
        <div className="p-5 pb-0 grid grid-cols-2 gap-4">
          {byType.map(t => (
            <div key={t.staff_type} className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 capitalize">{t.staff_type} Staff</p>
              <p className="text-lg font-bold text-gray-900">PKR {PKR(t.total_net)}</p>
              <p className="text-xs text-gray-400">{t.employees} employees</p>
            </div>
          ))}
        </div>
      )}
      <table className="w-full text-sm mt-4">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-y border-gray-100">
          <tr>
            <th className="px-5 py-3 text-left">Department</th>
            <th className="px-5 py-3 text-left">Type</th>
            <th className="px-5 py-3 text-right">Employees</th>
            <th className="px-5 py-3 text-right">Gross</th>
            <th className="px-5 py-3 text-right">EOBI</th>
            <th className="px-5 py-3 text-right">PF</th>
            <th className="px-5 py-3 text-right">Tax</th>
            <th className="px-5 py-3 text-right font-semibold">Net</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-5 py-3 font-medium text-gray-800">{r.department}</td>
              <td className="px-5 py-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.staff_type === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>{r.staff_type}</span>
              </td>
              <td className="px-5 py-3 text-right text-gray-600">{r.employees}</td>
              <td className="px-5 py-3 text-right font-mono text-gray-600">{PKR(r.total_gross)}</td>
              <td className="px-5 py-3 text-right font-mono text-gray-500">{PKR(r.total_eobi)}</td>
              <td className="px-5 py-3 text-right font-mono text-gray-500">{PKR(r.total_pf)}</td>
              <td className="px-5 py-3 text-right font-mono text-gray-500">{PKR(r.total_tax)}</td>
              <td className="px-5 py-3 text-right font-mono font-semibold text-gray-900">{PKR(r.total_net)}</td>
            </tr>
          ))}
          <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
            <td className="px-5 py-3 text-gray-800" colSpan={7}>Grand Total</td>
            <td className="px-5 py-3 text-right font-mono text-gray-900">PKR {PKR(grandNet)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function BankReport({ data }) {
  const rows  = data.data  || [];
  const banks = data.byBank || [];
  const grouped = {};
  rows.forEach(r => { const k = r.bank_short || 'CASH'; if (!grouped[k]) grouped[k] = []; grouped[k].push(r); });
  return (
    <div>
      {banks.length > 0 && (
        <div className="p-5 pb-0 flex flex-wrap gap-3">
          {banks.map(b => (
            <div key={b.bank} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 min-w-[140px]">
              <p className="text-xs text-gray-500 font-medium">{b.bank_name || b.bank}</p>
              <p className="text-base font-bold text-gray-900">PKR {PKR(b.total_amount)}</p>
              <p className="text-xs text-gray-400">{b.employees} employees</p>
            </div>
          ))}
        </div>
      )}
      {Object.entries(grouped).map(([bank, emps]) => (
        <div key={bank} className="mt-4">
          <div className="px-5 py-2 bg-blue-50 border-y border-blue-100">
            <span className="text-xs font-semibold text-blue-700 uppercase">{bank} — {emps.length} employees</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
              <tr>
                <th className="px-5 py-2 text-left">Emp ID</th>
                <th className="px-5 py-2 text-left">Employee Name</th>
                <th className="px-5 py-2 text-left">Department</th>
                <th className="px-5 py-2 text-left">Account No</th>
                <th className="px-5 py-2 text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {emps.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-2 font-mono text-xs text-gray-600">{r.emp_code}</td>
                  <td className="px-5 py-2 font-medium text-gray-800">{r.emp_name}</td>
                  <td className="px-5 py-2 text-gray-500 text-xs">{r.department_name}</td>
                  <td className="px-5 py-2 font-mono text-xs text-gray-600">{r.bank_account || '—'}</td>
                  <td className="px-5 py-2 text-right font-mono font-semibold text-gray-900">{PKR(r.amount)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-5 py-2 text-gray-700" colSpan={4}>Sub-total</td>
                <td className="px-5 py-2 text-right font-mono text-gray-900">PKR {PKR(emps.reduce((a, r) => a + Number(r.amount), 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      {rows.length === 0 && <div className="py-12 text-center text-gray-400 text-sm">No bank transfer data for this period.</div>}
    </div>
  );
}

function PfEobiReport({ data }) {
  const rows = data.data   || [];
  const t    = data.totals || {};
  return (
    <div className="overflow-x-auto">
      <div className="p-5 pb-0 grid grid-cols-2 md:grid-cols-3 gap-4">
        <Kpi label="Total PF (Employee + Employer)" value={`PKR ${PKR(t.total_pf)}`} />
        <Kpi label="Total EOBI"                     value={`PKR ${PKR(t.total_eobi)}`} />
        <Kpi label="Grand Total"                    value={`PKR ${PKR(Number(t.total_pf||0)+Number(t.total_eobi||0))}`} big />
      </div>
      <table className="w-full text-sm mt-4">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-y border-gray-100">
          <tr>
            <th className="px-4 py-3 text-left">Emp ID</th>
            <th className="px-4 py-3 text-left">Employee</th>
            <th className="px-4 py-3 text-left">Department</th>
            <th className="px-4 py-3 text-right">PF Employee</th>
            <th className="px-4 py-3 text-right">PF Employer</th>
            <th className="px-4 py-3 text-right">PF Total</th>
            <th className="px-4 py-3 text-right">EOBI Emp</th>
            <th className="px-4 py-3 text-right">EOBI Empr</th>
            <th className="px-4 py-3 text-right">EOBI Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-mono text-xs text-gray-500">{r.emp_code}</td>
              <td className="px-4 py-2 font-medium text-gray-800">{r.emp_name}</td>
              <td className="px-4 py-2 text-xs text-gray-500">{r.department_name}</td>
              <td className="px-4 py-2 text-right font-mono text-gray-600">{PKR(r.pf_employee_share)}</td>
              <td className="px-4 py-2 text-right font-mono text-gray-600">{PKR(r.pf_employer_share)}</td>
              <td className="px-4 py-2 text-right font-mono font-semibold text-gray-800">{PKR(r.pf_total)}</td>
              <td className="px-4 py-2 text-right font-mono text-gray-600">{PKR(r.eobi_employee_share)}</td>
              <td className="px-4 py-2 text-right font-mono text-gray-600">{PKR(r.eobi_employer_share)}</td>
              <td className="px-4 py-2 text-right font-mono font-semibold text-gray-800">{PKR(r.eobi_total)}</td>
            </tr>
          ))}
          {rows.length > 0 && (
            <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200 text-sm">
              <td className="px-4 py-3" colSpan={3}>Totals</td>
              <td className="px-4 py-3 text-right font-mono">{PKR(t.total_pf_employee)}</td>
              <td className="px-4 py-3 text-right font-mono">{PKR(t.total_pf_employer)}</td>
              <td className="px-4 py-3 text-right font-mono">{PKR(t.total_pf)}</td>
              <td className="px-4 py-3 text-right font-mono">{PKR(t.total_eobi_employee)}</td>
              <td className="px-4 py-3 text-right font-mono">{PKR(t.total_eobi_employer)}</td>
              <td className="px-4 py-3 text-right font-mono">{PKR(t.total_eobi)}</td>
            </tr>
          )}
          {rows.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-gray-400 text-sm">No PF/EOBI data for this period.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function TaxReport({ data }) {
  const rows = data.data   || [];
  const t    = data.totals || {};
  return (
    <div className="overflow-x-auto">
      <div className="p-5 pb-0 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Total Employees"   value={t.total_employees} />
        <Kpi label="Taxable Employees" value={t.taxable_employees} />
        <Kpi label="Monthly Tax"       value={`PKR ${PKR(t.total_tax)}`} />
        <Kpi label="Annual Projection" value={`PKR ${PKR(t.total_annual_projection)}`} big />
      </div>
      <table className="w-full text-sm mt-4">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-y border-gray-100">
          <tr>
            <th className="px-5 py-3 text-left">Emp ID</th>
            <th className="px-5 py-3 text-left">Employee</th>
            <th className="px-5 py-3 text-left">CNIC</th>
            <th className="px-5 py-3 text-left">Department</th>
            <th className="px-5 py-3 text-right">Basic Pay</th>
            <th className="px-5 py-3 text-right">Gross</th>
            <th className="px-5 py-3 text-right">Monthly Tax</th>
            <th className="px-5 py-3 text-right">Annual Projection</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-5 py-2 font-mono text-xs text-gray-500">{r.emp_code}</td>
              <td className="px-5 py-2 font-medium text-gray-800">{r.emp_name}</td>
              <td className="px-5 py-2 font-mono text-xs text-gray-500">{r.cnic}</td>
              <td className="px-5 py-2 text-xs text-gray-500">{r.department}</td>
              <td className="px-5 py-2 text-right font-mono text-gray-600">{PKR(r.basic_pay)}</td>
              <td className="px-5 py-2 text-right font-mono text-gray-600">{PKR(r.gross_salary)}</td>
              <td className="px-5 py-2 text-right font-mono font-semibold text-gray-900">{PKR(r.income_tax)}</td>
              <td className="px-5 py-2 text-right font-mono text-gray-600">{PKR(r.annual_tax_projection)}</td>
            </tr>
          ))}
          {rows.length > 0 && (
            <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
              <td className="px-5 py-3" colSpan={6}>Totals</td>
              <td className="px-5 py-3 text-right font-mono">PKR {PKR(t.total_tax)}</td>
              <td className="px-5 py-3 text-right font-mono">PKR {PKR(t.total_annual_projection)}</td>
            </tr>
          )}
          {rows.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-gray-400 text-sm">No tax data for this period.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function JvReport({ data }) {
  const rows   = data.data   || [];
  const totals = data.totals || {};
  const txns = {};
  rows.forEach(r => { if (!txns[r.transaction_no]) txns[r.transaction_no] = []; txns[r.transaction_no].push(r); });
  return (
    <div>
      <div className="p-5 pb-0 grid grid-cols-2 gap-4">
        <Kpi label="Total Debit"  value={`PKR ${PKR(totals.total_debit)}`} />
        <Kpi label="Total Credit" value={`PKR ${PKR(totals.total_credit)}`} big />
      </div>
      {Object.entries(txns).map(([txn, entries]) => (
        <div key={txn} className="mt-4">
          <div className="px-5 py-2 bg-purple-50 border-y border-purple-100">
            <span className="text-xs font-semibold text-purple-700">Transaction {txn}</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
              <tr>
                <th className="px-5 py-2 text-left">Account Code</th>
                <th className="px-5 py-2 text-left">Description</th>
                <th className="px-5 py-2 text-left">Department</th>
                <th className="px-5 py-2 text-right">Debit (PKR)</th>
                <th className="px-5 py-2 text-right">Credit (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-2 font-mono text-xs text-gray-600">{r.account_code}</td>
                  <td className="px-5 py-2 text-gray-800">{r.description}</td>
                  <td className="px-5 py-2 text-xs text-gray-500">{r.department_name || '—'}</td>
                  <td className="px-5 py-2 text-right font-mono text-gray-700">{Number(r.debit_amount)  > 0 ? PKR(r.debit_amount)  : '—'}</td>
                  <td className="px-5 py-2 text-right font-mono text-gray-700">{Number(r.credit_amount) > 0 ? PKR(r.credit_amount) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {rows.length === 0 && <div className="py-12 text-center text-gray-400 text-sm">No JV entries for this period. Run payroll first.</div>}
      {rows.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-between text-sm font-semibold">
          <span className="text-gray-700">Grand Total</span>
          <div className="flex gap-8">
            <span>Debit: PKR {PKR(totals.total_debit)}</span>
            <span>Credit: PKR {PKR(totals.total_credit)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, big }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-bold text-gray-900 ${big ? 'text-lg' : 'text-base'}`}>{value || '—'}</p>
    </div>
  );
}
