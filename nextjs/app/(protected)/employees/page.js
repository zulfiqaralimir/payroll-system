'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import api from '../../../lib/api';
import EmployeeForm from '../../../components/employees/EmployeeForm';

const PKR      = n => 'PKR ' + Number(n||0).toLocaleString('en-PK', { minimumFractionDigits: 0 });
const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-GB') : '—';

function Badge({ children, color }) {
  const cls = {
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-600',
    blue:   'bg-blue-100 text-blue-700',
    gray:   'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls[color]||cls.gray}`}>{children}</span>;
}

export default function EmployeeList() {
  const router = useRouter();

  const [employees,   setEmployees]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [banks,       setBanks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  const [search,     setSearch]     = useState('');
  const [fDept,      setFDept]      = useState('');
  const [fStaffType, setFStaffType] = useState('');
  const [fEmpType,   setFEmpType]   = useState('');
  const [fStatus,    setFStatus]    = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [deactId,  setDeactId]  = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [empRes, deptRes, bankRes] = await Promise.all([
        api.get('/employees/all'),
        api.get('/departments'),
        api.get('/banks'),
      ]);
      if (empRes.success)  setEmployees(empRes.data);
      if (deptRes.success) setDepartments(deptRes.data);
      if (bankRes.success) setBanks(bankRes.data);
    } catch (e) {
      setError('Failed to load data: ' + (e.message || ''));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(e => {
      if (fStatus === 'active'   && !e.is_active) return false;
      if (fStatus === 'inactive' &&  e.is_active) return false;
      if (fDept      && String(e.department_id) !== fDept) return false;
      if (fStaffType && e.staff_type      !== fStaffType)  return false;
      if (fEmpType   && e.employment_type !== fEmpType)    return false;
      if (q) {
        return (e.name        || '').toLowerCase().includes(q)
            || (e.employee_id || '').toLowerCase().includes(q)
            || (e.cnic        || '').toLowerCase().includes(q)
            || (e.designation || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [employees, search, fDept, fStaffType, fEmpType, fStatus]);

  const activeCount = employees.filter(e => e.is_active).length;
  const adminCount  = employees.filter(e => e.is_active && e.staff_type === 'admin').length;
  const directCount = employees.filter(e => e.is_active && e.staff_type === 'direct').length;

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}? This will remove them from payroll runs.`)) return;
    setDeactId(id);
    try {
      await api.del(`/employees/${id}`);
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, is_active: false } : e));
    } catch (e) { alert('Error: ' + (e.message || '')); }
    finally { setDeactId(null); }
  };

  const handleFormSave = () => { setShowForm(false); setEditing(null); loadAll(); };

  const handleExport = () => {
    const rows = filtered.map(e => ({
      'Employee ID':     e.employee_id,
      Name:              e.name,
      Designation:       e.designation,
      Department:        e.department_name,
      'Staff Type':      e.staff_type,
      CNIC:              e.cnic || '',
      'Father Name':     e.father_name || '',
      'Date of Joining': fmtDate(e.date_of_joining),
      'Employment Type': e.employment_type,
      Bank:              e.bank_name || '',
      'Account No':      e.bank_account || '',
      'Mode of Payment': e.mode_of_payment,
      'PF Member':           e.pf_member ? 'YES' : 'NO',
      EOBI:                  e.eobi_applicable ? 'YES' : 'NO',
      Religion:              e.religion || '',
      'Rig Bonus Eligible':  e.rig_bonus_eligible !== false ? 'YES' : 'NO',
      Status:                e.is_active ? 'Active' : 'Inactive',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, `WellServe-Employees-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const clearFilters = () => { setSearch(''); setFDept(''); setFStaffType(''); setFEmpType(''); setFStatus('active'); };
  const hasFilters = search || fDept || fStaffType || fEmpType || fStatus !== 'all';

  return (
    <div className="p-6">

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeCount} Active
            <span className="mx-1.5 text-gray-300">|</span>
            {adminCount} Admin
            <span className="mx-1.5 text-gray-300">|</span>
            {directCount} Direct Staff
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export Excel
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Add Employee
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, ID, CNIC, designation…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <select value={fDept} onChange={e => setFDept(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={fStaffType} onChange={e => setFStaffType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Staff Types</option>
            <option value="admin">Admin Staff</option>
            <option value="direct">Direct/Field Staff</option>
          </select>
          <select value={fEmpType} onChange={e => setFEmpType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Types</option>
            <option value="permanent">Permanent</option>
            <option value="contract">Contract</option>
            <option value="trainee">Trainee</option>
          </select>
          <select value={fStatus} onChange={e => setFStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="active">Active Only</option>
            <option value="all">All Employees</option>
            <option value="inactive">Inactive Only</option>
          </select>
          {hasFilters && <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline px-2 py-2">Clear filters</button>}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Showing <span className="font-bold text-blue-600">{filtered.length}</span>
            {filtered.length !== employees.length && ` of ${employees.length}`} employees
          </span>
          <button onClick={loadAll} className="text-xs text-blue-600 hover:underline">↻ Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Emp ID</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Designation</th>
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Bank</th>
                <th className="px-4 py-3 text-left font-medium">PF</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-16 text-center text-gray-400">
                  <svg className="animate-spin h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading employees…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-16 text-center text-gray-400 italic">
                  {hasFilters ? 'No employees match the current filters.' : 'No employees found.'}
                </td></tr>
              ) : filtered.map(emp => (
                <tr key={emp.id}
                  className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${!emp.is_active ? 'opacity-50' : ''}`}
                  onClick={() => router.push(`/employees/${emp.id}`)}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">{emp.employee_id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{emp.name}</div>
                    {emp.cnic && <div className="text-xs text-gray-400 font-mono">{emp.cnic}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{emp.designation}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-800">{emp.department_name}</div>
                    <div className="text-xs text-gray-400">{emp.staff_type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={emp.employment_type==='permanent'?'blue':emp.employment_type==='contract'?'orange':'gray'}>
                      {emp.employment_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{emp.bank_name || '—'}</td>
                  <td className="px-4 py-3">
                    {emp.pf_member ? <Badge color="green">PF</Badge> : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3"><Badge color={emp.is_active ? 'green' : 'red'}>{emp.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => router.push(`/employees/${emp.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline">View</button>
                      {emp.is_active && (
                        <>
                          <span className="text-gray-200">|</span>
                          <button onClick={() => { setEditing(emp); setShowForm(true); }}
                            className="text-gray-600 hover:text-gray-800 text-xs font-medium hover:underline">Edit</button>
                          <span className="text-gray-200">|</span>
                          <button onClick={() => handleDeactivate(emp.id, emp.name)} disabled={deactId === emp.id}
                            className="text-red-500 hover:text-red-700 text-xs font-medium hover:underline disabled:opacity-50">
                            {deactId === emp.id ? '…' : 'Deactivate'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <EmployeeForm
          employee={editing}
          departments={departments}
          banks={banks}
          onSave={handleFormSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
