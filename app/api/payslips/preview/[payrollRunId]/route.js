import pool from '@/lib/db';
import { generatePayslipHtml } from '@/lib/payslipHtml';

export async function GET(request, { params }) {
  const { payrollRunId } = await params;
  try {
    const r = await pool.query(`
      SELECT pr.*, e.employee_id AS employee_id_code, e.name, e.designation,
             e.bank_name, e.bank_account, e.pf_member, e.eobi_applicable,
             d.name AS department_name,
             ma.overtime_normal_hours, ma.overtime_holiday_hours,
             ma.rig_bonus_days_1, ma.rig_bonus_days_2, ma.travelling_days
      FROM payroll_runs pr
      JOIN employees e ON pr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN monthly_attendance ma
             ON ma.employee_id = e.id AND ma.month = pr.month AND ma.year = pr.year
      WHERE pr.id = $1
    `, [payrollRunId]);

    if (!r.rows[0]) {
      return new Response('Payslip not found', { status: 404 });
    }

    const html = generatePayslipHtml(r.rows[0], false);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
