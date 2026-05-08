import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { month, year } = await params;
  try {
    const r = await pool.query(
      'SELECT status, COUNT(*) AS employees, SUM(gross_salary) AS total_gross, SUM(net_salary) AS total_net FROM payroll_runs WHERE month=$1 AND year=$2 GROUP BY status',
      [month, year]
    );
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
