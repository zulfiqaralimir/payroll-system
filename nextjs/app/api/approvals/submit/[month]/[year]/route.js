import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request, { params }) {
  const { month, year } = await params;
  const { submitted_by } = await request.json();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      "UPDATE payroll_runs SET status='submitted', updated_at=NOW() WHERE month=$1 AND year=$2 AND status='draft' RETURNING id",
      [month, year]
    );
    if (r.rowCount === 0) { await client.query('ROLLBACK'); return NextResponse.json({ success: false, error: 'No draft payroll found. Run payroll first.' }, { status: 400 }); }
    await client.query(
      "INSERT INTO audit_log (user_id, action, table_name, new_values) VALUES ($1,'SUBMIT','payroll_runs',$2)",
      [submitted_by||null, JSON.stringify({ month, year, rows: r.rowCount })]
    );
    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: `${r.rowCount} payroll records submitted for CFO approval` });
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally { client.release(); }
}
