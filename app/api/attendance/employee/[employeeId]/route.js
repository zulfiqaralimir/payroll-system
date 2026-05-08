import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { employeeId } = await params;
  try {
    const r = await pool.query(
      'SELECT * FROM monthly_attendance WHERE employee_id=$1 ORDER BY year DESC, month DESC', [employeeId]
    );
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
