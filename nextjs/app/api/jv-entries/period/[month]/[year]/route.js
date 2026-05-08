import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { month, year } = await params;
  try {
    const r = await pool.query(`
      SELECT jv.*, d.name AS department_name FROM jv_entries jv
      LEFT JOIN departments d ON jv.department_id = d.id
      WHERE jv.month=$1 AND jv.year=$2 ORDER BY jv.transaction_no, jv.account_code
    `, [month, year]);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
