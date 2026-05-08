import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT month, year, status, COUNT(*) AS employees,
             SUM(gross_salary) AS total_gross, SUM(net_salary) AS total_net
      FROM payroll_runs GROUP BY month, year, status ORDER BY year DESC, month DESC
    `);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
