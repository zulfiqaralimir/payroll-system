import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT month, year, status, COUNT(*) AS employees,
             SUM(gross_salary) AS total_gross, SUM(total_deductions) AS total_deductions,
             SUM(net_salary) AS total_net, MAX(updated_at) AS last_updated, MAX(remarks) AS remarks
      FROM payroll_runs GROUP BY month, year, status ORDER BY year DESC, month DESC
    `);
    return NextResponse.json({ success: true, data: r.rows });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
