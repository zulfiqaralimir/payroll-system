import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import EmployeeForm from '../components/employees/EmployeeForm';

const fmt = (n) => n !== null && n !== undefined ? Number(n).toLocaleString('en-PK') : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { year:'numeric', month:'short', day:'numeric' }) : '—';

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-gray-50 last:border-0">
      <span className="w-44 text-xs font-medium text-gray-400 uppercase tracking-wide flex-shrink-0">{label}</span>
      <span className={`text-sm text-gray-800 mt-0.5 sm:mt-0 ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      {title && <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{title}</p>}
      {children}
    </div>
  );
}

function Badge({ label, color = 'gray' }) {
  const map = {
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
    blue:   'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    gray:   'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-700',
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[color]}`}>{label}</span>;
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [emp,        setEmp]       = useState(null);
  const [salary,     setSalary]    = useState(null);
  const [otRate,     setOtRate]    = useState(null);
  const [rigRate,    setRigRate]   = useState(null);
  const [travRate,   setTravRate]  = useState(null);
  const [history,    setHistory]   = useState([]);
  const [depts,      setDepts]     = useState([]);
  const [banks,      setBanks]     = useState([]);
  const [tab,        setTab]       = useState('personal');
  const [loading,    setLoading]   = useState(true);
  const [err,        setErr]       = useState('');
  const [showEdit,   setShowEdit]  = useState(false);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    setLoading(true); setErr('');
    try {
      const [eR, dR, bR] = await Promise.all([
        api.get(`/employees/${id}`),
        api.get('/departments'),
        api.get('/banks'),
      ]);
      if (!eR.success) { setErr(eR.error || 'Employee not found'); setLoading(false); return; }
      setEmp(eR.data);
      setDepts(dR.success ? dR.data : []);
      setBanks(bR.success ? bR.data : []);

      const [sR, oR, rR, tR, hR] = await Promise.all([
        api.get(`/salary-structures/employee/${id}`),
        api.get(`/overtime-rates/employee/${id}`),
        api.get(`/rig-bonus-rates/employee/${id}`),
        api.get(`/travelling-rates/employee/${id}`),
        api.get(`/payroll/employee/${id}`),
      ]);
      setSalary(sR.success ? sR.data : null);
      setOtRate(oR.success ? oR.data : null);
      setRigRate(rR.success ? rR.data : null);
      setTravRate(tR.success ? tR.data : null);
      setHistory(hR.success ? hR.data : []);
    } catch (e) {
      setErr('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = (updated) => {
    setEmp(updated);
    setShowEdit(false);
  };

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
      <button onClick={() => navigate('/employees')} className="text-blue-600 underline text-sm">Back to Employees</button>
    </div>
  );

  const TABS = [
    { key: 'personal',  label: 'Personal Info' },
    { key: 'salary',    label: 'Salary Structure' },
    { key: 'rates',     label: 'OT & Rig Rates' },
    { key: 'history',   label: 'Payroll History' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/employees')}
            className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-12 h-12 rounded-full bg-[#0f1e3a] flex items-center justify-center text-white font-bold text-lg">
            {emp.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{emp.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{emp.employee_id}</span>
              <span className="text-xs text-gray-400">{emp.designation}</span>
              <Badge
                label={emp.is_active ? 'Active' : 'Inactive'}
                color={emp.is_active ? 'green' : 'red'}
              />
              <Badge
                label={emp.employment_type}
                color={emp.employment_type === 'permanent' ? 'blue' : emp.employment_type === 'contract' ? 'yellow' : 'gray'}
              />
            </div>
          </div>
        </div>
        <button onClick={() => setShowEdit(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#0f1e3a] text-white rounded-lg hover:bg-[#1a2f5a] transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Personal Info */}
      {tab === 'personal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Identity">
            <InfoRow label="Employee ID"   value={emp.employee_id} mono />
            <InfoRow label="Full Name"     value={emp.name} />
            <InfoRow label="Designation"   value={emp.designation} />
            <InfoRow label="CNIC"          value={emp.cnic} mono />
            <InfoRow label="Father's Name" value={emp.father_name} />
            <InfoRow label="Mother's Name" value={emp.mother_name} />
          </Card>
          <Card title="Employment">
            <InfoRow label="Department"    value={emp.department_name} />
            <InfoRow label="Staff Type"    value={emp.staff_type} />
            <InfoRow label="Emp. Type"     value={emp.employment_type} />
            <InfoRow label="Date of Joining" value={fmtDate(emp.date_of_joining)} />
            <InfoRow label="Payment Mode"  value={emp.mode_of_payment} />
          </Card>
          <Card title="Bank Details">
            <InfoRow label="Bank"          value={emp.bank_name} />
            <InfoRow label="Account No."   value={emp.bank_account} mono />
          </Card>
          <Card title="Benefits">
            <InfoRow label="PF Member"     value={emp.pf_member ? 'Yes' : 'No'} />
            <InfoRow label="EOBI"          value={emp.eobi_applicable ? 'Applicable' : 'Not Applicable'} />
          </Card>
        </div>
      )}

      {/* Tab: Salary Structure */}
      {tab === 'salary' && (
        salary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Basic & Allowances">
              {(() => {
                const basic = Number(salary.basic_pay || 0);
                const hra   = Math.round(basic * Number(salary.hra_percentage || 40) / 100);
                const util  = Math.round(basic * Number(salary.utility_percentage || 5) / 100);
                const conv  = Math.round(basic * Number(salary.conveyance_percentage || 5) / 100);
                return (
                  <>
                    <InfoRow label="Basic Pay"               value={`PKR ${fmt(basic)}`} mono />
                    <InfoRow label={`House Rent (${salary.hra_percentage||40}%)`}  value={`PKR ${fmt(hra)}`} mono />
                    <InfoRow label={`Utility (${salary.utility_percentage||5}%)`}  value={`PKR ${fmt(util)}`} mono />
                    <InfoRow label={`Conveyance (${salary.conveyance_percentage||5}%)`} value={`PKR ${fmt(conv)}`} mono />
                    <InfoRow label="Gross (Base)"            value={`PKR ${fmt(basic + hra + util + conv)}`} mono />
                  </>
                );
              })()}
            </Card>
            <Card title="Deduction Info">
              <InfoRow label="PF Rate"        value={emp.pf_member ? '8.33% of Basic' : 'Not Enrolled'} />
              <InfoRow label="EOBI"           value={emp.eobi_applicable ? 'PKR 320 / month' : 'Not Applicable'} />
              <InfoRow label="Per Day Rate"   value={salary.per_day_rate ? `PKR ${fmt(salary.per_day_rate)}` : '—'} mono />
              <InfoRow label="Hourly Rate"    value={salary.hourly_rate  ? `PKR ${fmt(salary.hourly_rate)}`  : '—'} mono />
              <InfoRow label="Updated"        value={fmtDate(salary.updated_at)} />
            </Card>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No salary structure on record.</p>
            <p className="text-xs mt-1">Import from Excel to populate.</p>
          </div>
        )
      )}

      {/* Tab: OT & Rig Rates */}
      {tab === 'rates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Overtime Rate">
            {otRate ? (
              <>
                <InfoRow label="Normal OT Rate"  value={`PKR ${fmt(otRate.normal_rate)}`} mono />
                <InfoRow label="Holiday OT Rate" value={`PKR ${fmt(otRate.holiday_rate)}`} mono />
              </>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No overtime rate set</p>
            )}
          </Card>
          <Card title="Rig Bonus Rate">
            {rigRate ? (
              <>
                <InfoRow label="Rate USD 1"           value={`$ ${fmt(rigRate.rate_usd_1)}`} mono />
                <InfoRow label="Rate USD 2"           value={`$ ${fmt(rigRate.rate_usd_2)}`} mono />
                <InfoRow label="USD → PKR Rate"       value={fmt(rigRate.usd_conv_rate)} mono />
              </>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No rig bonus rate set</p>
            )}
          </Card>
          <Card title="Travelling Rate">
            {travRate ? (
              <>
                <InfoRow label="Daily Rate"     value={`PKR ${fmt(travRate.daily_rate)}`} mono />
                <InfoRow label="Conv. Rate"     value={fmt(travRate.conv_rate)} mono />
              </>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No travelling rate set</p>
            )}
          </Card>
        </div>
      )}

      {/* Tab: Payroll History */}
      {tab === 'history' && (
        history.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Period</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Gross</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Deductions</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Net Pay</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-700">
                      {new Date(r.year, r.month - 1).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{fmt(r.gross_salary)}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-500">{fmt(r.total_deductions)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-gray-800">{fmt(r.net_salary)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={r.status}
                        color={r.status === 'paid' ? 'green' : r.status === 'approved' ? 'blue' : r.status === 'submitted' ? 'yellow' : 'gray'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No payroll records yet.</p>
            <p className="text-xs mt-1">Records appear after payroll is run.</p>
          </div>
        )
      )}

      {/* Edit slide-over */}
      {showEdit && (
        <EmployeeForm
          employee={emp}
          departments={depts}
          banks={banks}
          onSave={handleSaved}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}
