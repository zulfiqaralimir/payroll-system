import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Returns payslip data as JSON — frontend renders PDF using @react-pdf/renderer
export async function GET(request, { params }) {
  const { payrollRunId } = await params;
  try {
    const r = await pool.query(`
      SELECT pr.*, e.employee_id AS employee_id_code, e.name, e.designation, e.bank_name, e.bank_account,
             e.pf_member, e.eobi_applicable, d.name AS department_name,
             ma.overtime_normal_hours, ma.overtime_holiday_hours, ma.rig_bonus_days_1, ma.rig_bonus_days_2, ma.travelling_days
      FROM payroll_runs pr JOIN employees e ON pr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN monthly_attendance ma ON ma.employee_id = e.id AND ma.month = pr.month AND ma.year = pr.year
      WHERE pr.id=$1
    `, [payrollRunId]);
    if (!r.rows[0]) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: r.rows[0] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
