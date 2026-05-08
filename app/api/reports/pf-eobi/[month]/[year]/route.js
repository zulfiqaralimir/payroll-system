import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { month, year } = await params;
  try {
    const r = await pool.query(`
      SELECT pe.*, e.employee_id AS emp_code, e.name AS emp_name, e.cnic, d.name AS department_name
      FROM pf_eobi_report pe JOIN employees e ON pe.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE pe.month=$1 AND pe.year=$2 ORDER BY e.employee_id
    `, [month, year]);
    const totals = (await pool.query(`
      SELECT SUM(pf_employee_share) AS total_pf_employee, SUM(pf_employer_share) AS total_pf_employer,
             SUM(pf_total) AS total_pf, SUM(eobi_employee_share) AS total_eobi_employee,
             SUM(eobi_employer_share) AS total_eobi_employer, SUM(eobi_total) AS total_eobi
      FROM pf_eobi_report WHERE month=$1 AND year=$2
    `, [month, year])).rows[0];
    return NextResponse.json({ success: true, data: r.rows, totals, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
