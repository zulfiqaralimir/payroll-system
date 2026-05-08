import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query('SELECT * FROM banks WHERE is_active=true ORDER BY short_name');
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { name, short_name, account_no, branch } = await request.json();
  try {
    const r = await pool.query(
      'INSERT INTO banks (name, short_name, account_no, branch) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, short_name, account_no, branch]
    );
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Bank created' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
