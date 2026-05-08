import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

const MODULES = ['dashboard','employees','salary_structures','attendance','payroll','payslips','approvals','reports','users','database','settings'];
const REPORTS = ['monthly_summary','department_cost','bank_transfers','pf_eobi','tax_report','jv_entries','ytd_report','loan_recovery'];

export async function GET(request) {
  const decoded = verifyToken(request);
  if (!decoded) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  if (decoded.role === 'admin') {
    const modules = {};
    MODULES.forEach(m => { modules[m] = { can_view: true, can_edit: true, can_delete: true, can_approve: true }; });
    const reports = {};
    REPORTS.forEach(r => { reports[r] = true; });
    return NextResponse.json({ success: true, data: { modules, departments: 'all', reports } });
  }

  try {
    const [modRows, deptRows, repRows] = await Promise.all([
      pool.query('SELECT module, can_view, can_edit, can_delete, can_approve FROM user_permissions WHERE user_id=$1', [decoded.id]),
      pool.query('SELECT department_id FROM user_department_access WHERE user_id=$1', [decoded.id]),
      pool.query('SELECT report_name, can_view FROM user_report_access WHERE user_id=$1', [decoded.id]),
    ]);

    const modules = {};
    MODULES.forEach(m => { modules[m] = { can_view: false, can_edit: false, can_delete: false, can_approve: false }; });
    modRows.rows.forEach(r => { modules[r.module] = { can_view: r.can_view, can_edit: r.can_edit, can_delete: r.can_delete, can_approve: r.can_approve }; });

    const departments = deptRows.rows.map(r => r.department_id);

    const reports = {};
    REPORTS.forEach(r => { reports[r] = false; });
    repRows.rows.forEach(r => { reports[r.report_name] = r.can_view; });

    return NextResponse.json({ success: true, data: { modules, departments, reports } });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
