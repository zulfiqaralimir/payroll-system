import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query('SELECT * FROM pf_schemes WHERE is_active=true ORDER BY scheme_type, short_name');
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { name, short_name, employee_rate, employer_rate, scheme_type, trustee } = await request.json();
  try {
    const r = await pool.query(
      'INSERT INTO pf_schemes (name, short_name, employee_rate, employer_rate, scheme_type, trustee) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, short_name, employee_rate || 0, employer_rate || 0, scheme_type, trustee]
    );
    return NextResponse.json({ success: true, data: r.rows[0], message: 'PF scheme created' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
