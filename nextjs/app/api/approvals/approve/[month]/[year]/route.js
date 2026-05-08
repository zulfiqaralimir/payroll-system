import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request, { params }) {
  const { month, year } = await params;
  const { approved_by, remarks } = await request.json();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      "UPDATE payroll_runs SET status='approved', approved_by=$3, remarks=$4, updated_at=NOW() WHERE month=$1 AND year=$2 AND status='submitted' RETURNING id",
      [month, year, approved_by||null, remarks||null]
    );
    if (r.rowCount === 0) { await client.query('ROLLBACK'); return NextResponse.json({ success: false, error: 'No submitted payroll found. Submit first.' }, { status: 400 }); }
    await client.query(
      "INSERT INTO audit_log (user_id, action, table_name, new_values) VALUES ($1,'APPROVE','payroll_runs',$2)",
      [approved_by||null, JSON.stringify({ month, year, rows: r.rowCount, remarks })]
    );
    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: `Payroll approved for ${month}/${year} (${r.rowCount} records)` });
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally { client.release(); }
}
