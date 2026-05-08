import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT e.*, d.name AS department_name, d.staff_type
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.is_active DESC, e.employee_id
    `);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
