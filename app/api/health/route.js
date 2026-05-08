import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query('SELECT NOW() AS time');
    return NextResponse.json({ success: true, db: 'connected', time: r.rows[0].time });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
