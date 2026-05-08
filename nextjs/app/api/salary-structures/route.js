import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT ss.*, e.employee_id AS emp_code, e.name AS emp_name
      FROM salary_structures ss
      JOIN employees e ON ss.employee_id = e.id
      ORDER BY e.employee_id
    `);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { employee_id, basic_pay, hra_percentage, utility_percentage, conveyance_percentage } = await request.json();
  const per_day = basic_pay / 30;
  const hourly = per_day / 8;
  try {
    const r = await pool.query(`
      INSERT INTO salary_structures
        (employee_id, basic_pay, hra_percentage, utility_percentage, conveyance_percentage, per_day_rate, hourly_rate)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (employee_id) DO UPDATE SET
        basic_pay=$2, hra_percentage=$3, utility_percentage=$4,
        conveyance_percentage=$5, per_day_rate=$6, hourly_rate=$7, updated_at=NOW()
      RETURNING *
    `, [employee_id, basic_pay, hra_percentage || 40, utility_percentage || 5, conveyance_percentage || 5, per_day, hourly]);
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Salary structure saved' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
