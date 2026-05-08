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
    const totals = (await pool.query(
      'SELECT SUM(debit_amount) AS total_debit, SUM(credit_amount) AS total_credit FROM jv_entries WHERE month=$1 AND year=$2',
      [month, year]
    )).rows[0];
    return NextResponse.json({ success: true, data: r.rows, totals, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
