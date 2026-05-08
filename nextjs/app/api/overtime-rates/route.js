import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT ot.*, e.employee_id AS emp_code, e.name AS emp_name
      FROM overtime_rates ot JOIN employees e ON ot.employee_id = e.id ORDER BY e.employee_id
    `);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { employee_id, normal_rate, holiday_rate } = await request.json();
  try {
    const r = await pool.query(`
      INSERT INTO overtime_rates (employee_id, normal_rate, holiday_rate) VALUES ($1,$2,$3)
      ON CONFLICT (employee_id) DO UPDATE SET normal_rate=$2, holiday_rate=$3, updated_at=NOW()
      RETURNING *
    `, [employee_id, normal_rate, holiday_rate]);
    return NextResponse.json({ success: true, data: r.rows[0], message: 'OT rates saved' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
