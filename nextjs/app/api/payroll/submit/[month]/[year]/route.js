import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request, { params }) {
  const { month, year } = await params;
  try {
    const r = await pool.query(
      "UPDATE payroll_runs SET status='submitted', updated_at=NOW() WHERE month=$1 AND year=$2 AND status='draft' RETURNING id",
      [month, year]
    );
    if (r.rowCount === 0)
      return NextResponse.json({ success: false, error: 'No draft payroll found. Run payroll first.' }, { status: 400 });
    return NextResponse.json({ success: true, message: `${r.rowCount} records submitted for CFO approval` });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
