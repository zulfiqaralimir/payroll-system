'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';

const PKR = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MASTER_TABS = [
  { key: 'departments',       label: 'Departments',    endpoint: '/departments' },
  { key: 'employees',         label: 'Employees',      endpoint: '/employees' },
  { key: 'salary-structures', label: 'Salary Rates',   endpoint: '/salary-structures' },
  { key: 'overtime-rates',    label: 'OT Rates',       endpoint: '/overtime-rates' },
  { key: 'rig-bonus-rates',   label: 'Rig Bonus',      endpoint: '/rig-bonus-rates' },
  { key: 'travelling-rates',  label: 'Travelling',     endpoint: '/travelling-rates' },
  { key: 'tax-slabs',         label: 'Tax Slabs',      endpoint: '/tax-slabs' },
  { key: 'account-codes',     label: 'GL Codes',       endpoint: '/account-codes' },
  { key: 'banks',             label: 'Banks',          endpoint: '/banks' },
  { key: 'pf-schemes',        label: 'PF Schemes',     endpoint: '/pf-schemes' },
];

const DERIVED_TABS = [
  { key: 'attendance',     label: 'Attendance',     endpoint: '/attendance' },
  { key: 'deductions',     label: 'Deductions',     endpoint: '/deductions' },
  { key: 'payroll',        label: 'Payroll Runs',   endpoint: '/payroll' },
  { key: 'payslips',       label: 'Payslips',       endpoint: '/payslips' },
  { key: 'bank-transfers', label: 'Bank Transfers', endpoint: '/bank-transfers' },
  { key: 'pf-eobi',        label: 'PF / EOBI',      endpoint: '/pf-eobi' },
  { key: 'jv-entries',     label: 'JV Entries',     endpoint: '/jv-entries' },
  { key: 'users',          label: 'Users',          endpoint: '/users' },
  { key: 'audit-log',      label: 'Audit Log',      endpoint: '/audit-log' },
];

const ALL_TABS = [...MASTER_TABS, ...DERIVED_TABS];

function StatusBadge({ active }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function RoleBadge({ role }) {
  const colors = { admin: 'bg-red-100 text-red-700', hr_manager: 'bg-blue-100 text-blue-700', cfo: 'bg-purple-100 text-purple-700' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-600'}`}>{role}</span>;
}

function StatusPayroll({ status }) {
  const colors = { draft: 'bg-yellow-100 text-yellow-700', submitted: 'bg-blue-100 text-blue-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-600', paid: 'bg-emerald-100 text-emerald-700' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

function DepartmentsTab({ data, onDeactivate }) {
  const admin  = data.filter(d => d.staff_type === 'admin');
  const direct = data.filter(d => d.staff_type === 'direct');
  const Section = ({ title, color, rows }) => (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div className={`px-4 py-2 text-sm font-semibold ${color === 'green' ? 'bg-green-50 text-green-800 border-b border-green-200' : 'bg-blue-50 text-blue-800 border-b border-blue-200'}`}>{title}</div>
      <table className="w-full text-sm bg-white">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr><th className="px-4 py-2 text-left">ID</th><th className="px-4 py-2 text-left">Department</th><th className="px-4 py-2 text-left">Status</th><th className="px-4 py-2 text-left">Action</th></tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(r => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">{r.id}</td>
              <td className="px-4 py-2 font-medium">{r.name}</td>
              <td className="px-4 py-2"><StatusBadge active={r.is_active} /></td>
              <td className="px-4 py-2">{r.is_active && <button onClick={() => onDeactivate(r.id)} className="text-red-500 hover:text-red-700 text-xs underline">Deactivate</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <div>
      <Section title={`Admin Staff (${admin.length})`} color="green" rows={admin} />
      <Section title={`Direct / Field Staff (${direct.length})`} color="blue" rows={direct} />
    </div>
  );
}

const COL_DEFS = {
  employees: [
    { label: 'Emp ID',      key: 'employee_id' },
    { label: 'Name',        key: 'name' },
    { label: 'Designation', key: 'designation' },
    { label: 'Department',  key: 'department_name' },
    { label: 'Type',        key: 'employment_type' },
    { label: 'Bank',        key: 'bank_name' },
    { label: 'Status',      render: r => <StatusBadge active={r.is_active} /> },
  ],
  'salary-structures': [
    { label: 'Emp ID',    key: 'emp_code' },
    { label: 'Name',      key: 'emp_name' },
    { label: 'Basic Pay', render: r => PKR(r.basic_pay) },
    { label: 'HRA %',     key: 'hra_percentage' },
    { label: 'Utility %', key: 'utility_percentage' },
    { label: 'Conv %',    key: 'conveyance_percentage' },
    { label: 'Per Day',   render: r => PKR(r.per_day_rate) },
  ],
  'overtime-rates': [
    { label: 'Emp ID',       key: 'emp_code' },
    { label: 'Name',         key: 'emp_name' },
    { label: 'Normal Rate',  render: r => PKR(r.normal_rate) },
    { label: 'Holiday Rate', render: r => PKR(r.holiday_rate) },
  ],
  'rig-bonus-rates': [
    { label: 'Emp ID',     key: 'emp_code' },
    { label: 'Name',       key: 'emp_name' },
    { label: 'Rate USD 1', key: 'rate_usd_1' },
    { label: 'Rate USD 2', key: 'rate_usd_2' },
    { label: 'Conv Rate',  key: 'usd_conv_rate' },
  ],
  'travelling-rates': [
    { label: 'Emp ID',     key: 'emp_code' },
    { label: 'Name',       key: 'emp_name' },
    { label: 'Daily Rate', render: r => PKR(r.daily_rate) },
    { label: 'Conv Rate',  key: 'conv_rate' },
  ],
  'tax-slabs': [
    { label: 'Year',        key: 'tax_year' },
    { label: 'Min Income',  render: r => PKR(r.min_income) },
    { label: 'Max Income',  render: r => r.max_income ? PKR(r.max_income) : 'No Limit' },
    { label: 'Tax Rate %',  key: 'tax_rate' },
    { label: 'Fixed Tax',   render: r => PKR(r.fixed_tax) },
    { label: 'Description', key: 'description' },
  ],
  'account-codes': [
    { label: 'Code',         key: 'account_code' },
    { label: 'Account Name', key: 'account_name' },
    { label: 'Department',   render: r => r.department_name || '(All Dept)' },
    { label: 'Type',         key: 'entry_type' },
    { label: 'Category',     key: 'category' },
  ],
  banks: [
    { label: 'Short Name', key: 'short_name' },
    { label: 'Bank Name',  key: 'name' },
    { label: 'Account No', render: r => r.account_no || '—' },
    { label: 'Branch',     render: r => r.branch || '—' },
    { label: 'Status',     render: r => <StatusBadge active={r.is_active} /> },
  ],
  'pf-schemes': [
    { label: 'Code',        key: 'short_name' },
    { label: 'Scheme Name', key: 'name' },
    { label: 'Type',        key: 'scheme_type' },
    { label: 'Trustee',     key: 'trustee' },
  ],
  attendance: [
    { label: 'Emp ID',     key: 'emp_code' },
    { label: 'Name',       key: 'emp_name' },
    { label: 'Month/Year', render: r => `${r.month}/${r.year}` },
    { label: 'Absent',     key: 'absent_days' },
    { label: 'LWP',        key: 'leave_without_pay' },
    { label: 'OT Hours',   key: 'overtime_normal_hours' },
    { label: 'Rig Days',   key: 'rig_bonus_days_1' },
    { label: 'Travel Days',key: 'travelling_days' },
  ],
  deductions: [
    { label: 'Emp ID',     key: 'emp_code' },
    { label: 'Name',       key: 'emp_name' },
    { label: 'Month/Year', render: r => `${r.month}/${r.year}` },
    { label: 'EOBI',       render: r => PKR(r.eobi) },
    { label: 'Income Tax', render: r => PKR(r.income_tax) },
    { label: 'PF',         render: r => PKR(r.provident_fund) },
    { label: 'Total',      render: r => PKR(r.total_deductions) },
  ],
  payroll: [
    { label: 'Month',      key: 'month' },
    { label: 'Year',       key: 'year' },
    { label: 'Employees',  key: 'employees' },
    { label: 'Total Gross',render: r => PKR(r.total_gross) },
    { label: 'Total Net',  render: r => PKR(r.total_net) },
    { label: 'Status',     render: r => <StatusPayroll status={r.status} /> },
  ],
  payslips: [
    { label: 'Emp ID',     key: 'emp_code' },
    { label: 'Name',       key: 'emp_name' },
    { label: 'Month/Year', render: r => `${r.month}/${r.year}` },
    { label: 'Generated',  render: r => r.generated_at ? new Date(r.generated_at).toLocaleDateString() : '—' },
    { label: 'Emailed',    render: r => r.emailed ? '✓' : '—' },
  ],
  'bank-transfers': [
    { label: 'Emp ID',     key: 'emp_code' },
    { label: 'Name',       key: 'emp_name' },
    { label: 'Bank',       key: 'bank_short' },
    { label: 'Account',    key: 'bank_account' },
    { label: 'Amount',     render: r => PKR(r.amount) },
    { label: 'Month/Year', render: r => `${r.month}/${r.year}` },
    { label: 'Status',     key: 'status' },
  ],
  'pf-eobi': [
    { label: 'Emp ID',       key: 'emp_code' },
    { label: 'Name',         key: 'emp_name' },
    { label: 'Month/Year',   render: r => `${r.month}/${r.year}` },
    { label: 'PF Emp Share', render: r => PKR(r.pf_employee_share) },
    { label: 'PF Empr Share',render: r => PKR(r.pf_employer_share) },
    { label: 'EOBI Emp',     render: r => PKR(r.eobi_employee_share) },
    { label: 'EOBI Total',   render: r => PKR(r.eobi_total) },
  ],
  'jv-entries': [
    { label: 'Month/Year',   render: r => `${r.month}/${r.year}` },
    { label: 'Txn',          key: 'transaction_no' },
    { label: 'GL Code',      key: 'account_code' },
    { label: 'Account Name', key: 'account_name' },
    { label: 'Debit',        render: r => r.debit_amount > 0 ? PKR(r.debit_amount) : '—' },
    { label: 'Credit',       render: r => r.credit_amount > 0 ? PKR(r.credit_amount) : '—' },
    { label: 'Department',   render: r => r.department_name || '—' },
  ],
  users: [
    { label: 'Name',       key: 'name' },
    { label: 'Email',      key: 'email' },
    { label: 'Role',       render: r => <RoleBadge role={r.role} /> },
    { label: 'Status',     render: r => <StatusBadge active={r.is_active} /> },
    { label: 'Last Login', render: r => r.last_login ? new Date(r.last_login).toLocaleDateString() : 'Never' },
  ],
  'audit-log': [
    { label: 'User',      key: 'user_name' },
    { label: 'Role',      render: r => r.user_role ? <RoleBadge role={r.user_role} /> : '—' },
    { label: 'Action',    key: 'action' },
    { label: 'Table',     render: r => r.table_name || '—' },
    { label: 'Record ID', render: r => r.record_id || '—' },
    { label: 'Time',      render: r => new Date(r.performed_at).toLocaleString() },
  ],
};

function GenericTable({ tabKey, data, onDeactivate }) {
  const cols = COL_DEFS[tabKey] || [];
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm bg-white min-w-max">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            {cols.map(c => <th key={c.label} className="px-4 py-3 text-left font-medium whitespace-nowrap">{c.label}</th>)}
            <th className="px-4 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr><td colSpan={cols.length + 1} className="px-4 py-10 text-center text-gray-400 italic">No records yet</td></tr>
          ) : data.map((r, i) => (
            <tr key={r.id || i} className="hover:bg-gray-50">
              {cols.map(c => (
                <td key={c.label} className="px-4 py-2.5 whitespace-nowrap">
                  {c.render ? c.render(r) : (r[c.key] ?? '—')}
                </td>
              ))}
              <td className="px-4 py-2.5">
                {r.is_active !== false && onDeactivate && (
                  <button onClick={() => onDeactivate(r.id)}
                    className="text-red-500 hover:text-red-700 text-xs underline">
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MasterTables() {
  const [activeTab, setActiveTab] = useState('departments');
  const [tableData, setTableData] = useState({});
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [counts,    setCounts]    = useState({});
  const [dbStatus,  setDbStatus]  = useState('checking...');

  const fetchTab = useCallback(async (tabKey) => {
    const tab = ALL_TABS.find(t => t.key === tabKey);
    if (!tab) return;
    setLoading(true); setError('');
    try {
      const res = await api.get(tab.endpoint);
      if (res.success) {
        setTableData(prev => ({ ...prev, [tabKey]: res.data }));
        setCounts(prev => ({ ...prev, [tabKey]: res.count }));
      }
    } catch (err) {
      setError('Failed to load: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/health').then(r => setDbStatus(r.db === 'connected' ? 'connected' : 'error')).catch(() => setDbStatus('offline'));
  }, []);

  useEffect(() => { fetchTab(activeTab); }, [activeTab, fetchTab]);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this record?')) return;
    const tab = ALL_TABS.find(t => t.key === activeTab);
    try {
      await api.del(`${tab.endpoint}/${id}`);
      fetchTab(activeTab);
    } catch (err) {
      alert('Error: ' + (err.message || 'Unknown error'));
    }
  };

  const data = tableData[activeTab] || [];

  const summaryCards = [
    { label: 'Departments', key: 'departments',   color: 'bg-blue-600' },
    { label: 'Tax Slabs',   key: 'tax-slabs',     color: 'bg-orange-500' },
    { label: 'GL Codes',    key: 'account-codes', color: 'bg-purple-600' },
    { label: 'Banks',       key: 'banks',         color: 'bg-teal-600' },
    { label: 'PF Schemes',  key: 'pf-schemes',    color: 'bg-rose-600' },
    { label: 'Users',       key: 'users',         color: 'bg-indigo-600' },
  ];

  return (
    <div className="p-5 max-w-screen-xl mx-auto">

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Master Tables</h1>
          <p className="text-sm text-gray-400 mt-0.5">Database viewer — all tables and records</p>
        </div>
        <div className="text-sm flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'}`}></span>
          <span className="text-gray-500 text-xs">DB: {dbStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {summaryCards.map(c => (
          <button key={c.key} onClick={() => setActiveTab(c.key)}
            className={`${c.color} rounded-lg p-3 text-white shadow text-left hover:opacity-90 transition-opacity`}>
            <div className="text-2xl font-bold">{counts[c.key] ?? '—'}</div>
            <div className="text-xs opacity-80">{c.label}</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200">

        <div className="px-4 pt-3 pb-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Master Tables (10)</p>
          <div className="flex flex-wrap gap-1">
            {MASTER_TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                  ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {tab.label}
                {counts[tab.key] !== undefined && (
                  <span className={`ml-1 text-xs ${activeTab === tab.key ? 'text-blue-200' : 'text-gray-400'}`}>
                    ({counts[tab.key]})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pt-3 pb-0 border-t border-gray-100 mt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Derived Tables (7) + System Tables</p>
          <div className="flex flex-wrap gap-1">
            {DERIVED_TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                  ${activeTab === tab.key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {tab.label}
                {counts[tab.key] !== undefined && (
                  <span className={`ml-1 text-xs ${activeTab === tab.key ? 'text-emerald-200' : 'text-gray-400'}`}>
                    ({counts[tab.key]})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 mt-3 border-t border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Loading {ALL_TABS.find(t => t.key === activeTab)?.label}...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">
                  {ALL_TABS.find(t => t.key === activeTab)?.label}
                  <span className="ml-2 text-gray-400 font-normal">— {data.length} records</span>
                </span>
                <button onClick={() => fetchTab(activeTab)} className="text-xs text-blue-600 hover:underline">↻ Refresh</button>
              </div>

              {activeTab === 'departments'
                ? <DepartmentsTab data={data} onDeactivate={handleDeactivate} />
                : <GenericTable tabKey={activeTab} data={data} onDeactivate={handleDeactivate} />
              }
            </>
          )}
        </div>
      </div>
    </div>
  );
}
