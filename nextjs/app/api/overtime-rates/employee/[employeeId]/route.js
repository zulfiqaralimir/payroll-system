import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { employeeId } = await params;
  try {
    const r = await pool.query('SELECT * FROM overtime_rates WHERE employee_id=$1', [employeeId]);
    return NextResponse.json({ success: true, data: r.rows[0] || null });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
