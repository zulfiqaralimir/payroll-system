import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request, { params }) {
  const { month, year } = await params;
  const { paid_by } = await request.json();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      "UPDATE payroll_runs SET status='paid', updated_at=NOW() WHERE month=$1 AND year=$2 AND status='approved' RETURNING id",
      [month, year]
    );
    if (r.rowCount === 0) { await client.query('ROLLBACK'); return NextResponse.json({ success: false, error: 'No approved payroll found.' }, { status: 400 }); }
    await client.query(
      "INSERT INTO audit_log (user_id, action, table_name, new_values) VALUES ($1,'MARK_PAID','payroll_runs',$2)",
      [paid_by||null, JSON.stringify({ month, year, rows: r.rowCount })]
    );
    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: `${r.rowCount} payroll records marked as paid` });
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally { client.release(); }
}
