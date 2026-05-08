import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { month, year } = await params;
  try {
    const r = await pool.query(`
      SELECT ma.*, e.employee_id AS emp_code, e.name AS emp_name, d.name AS department_name
      FROM monthly_attendance ma
      JOIN employees e ON ma.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ma.month=$1 AND ma.year=$2
      ORDER BY e.employee_id
    `, [month, year]);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
