import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query('SELECT * FROM tax_slabs WHERE is_active=true ORDER BY tax_year, min_income');
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { tax_year, min_income, max_income, tax_rate, fixed_tax, description } = await request.json();
  try {
    const r = await pool.query(
      'INSERT INTO tax_slabs (tax_year, min_income, max_income, tax_rate, fixed_tax, description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [tax_year, min_income, max_income, tax_rate || 0, fixed_tax || 0, description]
    );
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Tax slab created' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
