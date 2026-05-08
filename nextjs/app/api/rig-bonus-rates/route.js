import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT rb.*, e.employee_id AS emp_code, e.name AS emp_name
      FROM rig_bonus_rates rb JOIN employees e ON rb.employee_id = e.id ORDER BY e.employee_id
    `);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { employee_id, rate_usd_1, rate_usd_2, usd_conv_rate } = await request.json();
  try {
    const r = await pool.query(`
      INSERT INTO rig_bonus_rates (employee_id, rate_usd_1, rate_usd_2, usd_conv_rate) VALUES ($1,$2,$3,$4)
      ON CONFLICT (employee_id) DO UPDATE SET rate_usd_1=$2, rate_usd_2=$3, usd_conv_rate=$4, updated_at=NOW()
      RETURNING *
    `, [employee_id, rate_usd_1 || 0, rate_usd_2 || 0, usd_conv_rate || 278]);
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Rig bonus rates saved' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
