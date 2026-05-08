import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { month, year } = await params;
  try {
    const r = await pool.query(`
      SELECT e.employee_id AS emp_code, e.name AS emp_name, e.cnic, d.name AS department,
             pr.basic_pay, pr.gross_salary, pr.income_tax, pr.income_tax * 12 AS annual_tax_projection, pr.status
      FROM payroll_runs pr JOIN employees e ON pr.employee_id = e.id JOIN departments d ON e.department_id = d.id
      WHERE pr.month=$1 AND pr.year=$2 ORDER BY pr.income_tax DESC
    `, [month, year]);
    const totals = (await pool.query(`
      SELECT SUM(income_tax) AS total_tax, SUM(income_tax*12) AS total_annual_projection,
             COUNT(*) FILTER (WHERE income_tax > 0) AS taxable_employees, COUNT(*) AS total_employees
      FROM payroll_runs WHERE month=$1 AND year=$2
    `, [month, year])).rows[0];
    return NextResponse.json({ success: true, data: r.rows, totals, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
