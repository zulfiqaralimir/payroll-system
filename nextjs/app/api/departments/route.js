import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query('SELECT * FROM departments ORDER BY staff_type, name');
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { name, staff_type, description } = await request.json();
  try {
    const r = await pool.query(
      'INSERT INTO departments (name, staff_type, description) VALUES ($1,$2,$3) RETURNING *',
      [name, staff_type, description]
    );
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Department created' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
