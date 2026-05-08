'use client';

import { useState, useEffect } from 'react';
import api from '../../lib/api';

const CNIC_RE = /^\d{5}-\d{7}-\d{1}$/;

const BLANK = {
  employee_id: '', name: '', designation: '', department_id: '',
  cnic: '', father_name: '', mother_name: '', date_of_joining: '',
  employment_type: 'permanent', bank_name: 'FBL', bank_account: '',
  mode_of_payment: 'bank', pf_member: false, eobi_applicable: true,
};

export default function EmployeeForm({ employee, departments, banks, onSave, onClose }) {
  const isEdit = !!employee?.id;
  const [form,   setForm]   = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');

  useEffect(() => {
    if (employee) {
      setForm({
        employee_id:     employee.employee_id     || '',
        name:            employee.name            || '',
        designation:     employee.designation     || '',
        department_id:   employee.department_id   || '',
        cnic:            employee.cnic            || '',
        father_name:     employee.father_name     || '',
        mother_name:     employee.mother_name     || '',
        date_of_joining: employee.date_of_joining
                           ? new Date(employee.date_of_joining).toISOString().slice(0, 10)
                           : '',
        employment_type: employee.employment_type || 'permanent',
        bank_name:       employee.bank_name       || 'FBL',
        bank_account:    employee.bank_account    || '',
        mode_of_payment: employee.mode_of_payment || 'bank',
        pf_member:       employee.pf_member       ?? false,
        eobi_applicable: employee.eobi_applicable ?? true,
      });
    } else {
      setForm(BLANK);
    }
    setErrors({});
    setApiErr('');
  }, [employee]);

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.employee_id.trim()) e.employee_id  = 'Employee ID is required';
    if (!form.name.trim())        e.name         = 'Name is required';
    if (!form.designation.trim()) e.designation  = 'Designation is required';
    if (!form.department_id)      e.department_id = 'Department is required';
    if (form.cnic && !CNIC_RE.test(form.cnic)) e.cnic = 'Format: 00000-0000000-0';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setApiErr('');
    try {
      const payload = { ...form, department_id: parseInt(form.department_id) };
      const res = isEdit
        ? await api.put(`/employees/${employee.id}`, payload)
        : await api.post('/employees', payload);
      if (res.success) { onSave(res.data); }
      else setApiErr(res.error || 'Save failed');
    } catch (err) {
      setApiErr(err.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const F = ({ label, req, error, children }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{req && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );

  const inp    = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const errInp = "w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden">

        <div className="bg-[#0f1e3a] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white font-bold">{isEdit ? 'Edit Employee' : 'Add New Employee'}</h2>
            <p className="text-blue-300 text-xs mt-0.5">{isEdit ? employee.employee_id + ' — ' + employee.name : 'Fill all required fields'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {apiErr && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{apiErr}</div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Identity</p>
            <div className="grid grid-cols-2 gap-3">
              <F label="Employee ID" req error={errors.employee_id}>
                <input value={form.employee_id} onChange={e => set('employee_id', e.target.value)}
                  placeholder="ITS-001" className={errors.employee_id ? errInp : inp} />
              </F>
              <F label="Full Name" req error={errors.name}>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Ahmed Khan" className={errors.name ? errInp : inp} />
              </F>
              <F label="Designation" req error={errors.designation}>
                <input value={form.designation} onChange={e => set('designation', e.target.value)}
                  placeholder="Senior Engineer" className={errors.designation ? errInp : inp} />
              </F>
              <F label="CNIC" error={errors.cnic}>
                <input value={form.cnic} onChange={e => set('cnic', e.target.value)}
                  placeholder="35202-1234567-1" className={errors.cnic ? errInp : inp} />
              </F>
              <F label="Father's Name">
                <input value={form.father_name} onChange={e => set('father_name', e.target.value)}
                  placeholder="Muhammad Ali" className={inp} />
              </F>
              <F label="Mother's Name">
                <input value={form.mother_name} onChange={e => set('mother_name', e.target.value)}
                  placeholder="Fatima Begum" className={inp} />
              </F>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Employment</p>
            <div className="grid grid-cols-2 gap-3">
              <F label="Department" req error={errors.department_id}>
                <select value={form.department_id} onChange={e => set('department_id', e.target.value)}
                  className={errors.department_id ? errInp : inp}>
                  <option value="">— Select Department —</option>
                  {departments.filter(d => d.is_active).map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.staff_type})</option>
                  ))}
                </select>
              </F>
              <F label="Date of Joining">
                <input type="date" value={form.date_of_joining} onChange={e => set('date_of_joining', e.target.value)}
                  className={inp} />
              </F>
              <F label="Employment Type">
                <select value={form.employment_type} onChange={e => set('employment_type', e.target.value)} className={inp}>
                  <option value="permanent">Permanent</option>
                  <option value="contract">Contract</option>
                  <option value="trainee">Trainee</option>
                </select>
              </F>
              <F label="Mode of Payment">
                <select value={form.mode_of_payment}
                  onChange={e => { set('mode_of_payment', e.target.value); if (e.target.value === 'cash') set('bank_name', 'Cash'); }}
                  className={inp}>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </F>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Bank Details</p>
            <div className="grid grid-cols-2 gap-3">
              <F label="Bank">
                <select value={form.bank_name} onChange={e => set('bank_name', e.target.value)} className={inp}>
                  {banks.map(b => (
                    <option key={b.id} value={b.short_name}>{b.short_name} — {b.name}</option>
                  ))}
                </select>
              </F>
              <F label="Bank Account No.">
                <input value={form.bank_account} onChange={e => set('bank_account', e.target.value)}
                  placeholder="0360240000001001" className={inp}
                  disabled={form.mode_of_payment === 'cash'} />
              </F>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Benefits</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.pf_member}
                  onChange={e => set('pf_member', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">PF Member</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.eobi_applicable}
                  onChange={e => set('eobi_applicable', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">EOBI Applicable</span>
              </label>
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50">
          <button onClick={onClose} type="button"
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition flex items-center gap-2">
            {saving
              ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving...</>
              : isEdit ? 'Save Changes' : 'Add Employee'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
