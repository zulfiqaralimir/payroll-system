import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT tr.*, e.employee_id AS emp_code, e.name AS emp_name
      FROM travelling_rates tr JOIN employees e ON tr.employee_id = e.id ORDER BY e.employee_id
    `);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { employee_id, daily_rate, conv_rate } = await request.json();
  try {
    const r = await pool.query(`
      INSERT INTO travelling_rates (employee_id, daily_rate, conv_rate) VALUES ($1,$2,$3)
      ON CONFLICT (employee_id) DO UPDATE SET daily_rate=$2, conv_rate=$3, updated_at=NOW()
      RETURNING *
    `, [employee_id, daily_rate || 1500, conv_rate || 1]);
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Travelling rates saved' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
