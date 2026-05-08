import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { month, year } = await params;
  try {
    const r = await pool.query(`
      SELECT md.*, e.employee_id AS emp_code, e.name AS emp_name
      FROM monthly_deductions md
      JOIN employees e ON md.employee_id = e.id
      WHERE md.month=$1 AND md.year=$2 ORDER BY e.employee_id
    `, [month, year]);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
