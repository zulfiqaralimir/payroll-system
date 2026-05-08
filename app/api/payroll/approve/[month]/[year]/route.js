import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request, { params }) {
  const { month, year } = await params;
  const { remarks } = await request.json();
  try {
    const r = await pool.query(
      "UPDATE payroll_runs SET status='approved', remarks=$3, updated_at=NOW() WHERE month=$1 AND year=$2 AND status='submitted' RETURNING id",
      [month, year, remarks || null]
    );
    if (r.rowCount === 0)
      return NextResponse.json({ success: false, error: 'No submitted payroll found.' }, { status: 400 });
    return NextResponse.json({ success: true, message: `Payroll approved for ${month}/${year}` });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
