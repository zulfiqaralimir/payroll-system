import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT ac.*, d.name AS department_name FROM account_codes ac
      LEFT JOIN departments d ON ac.department_id = d.id
      WHERE ac.is_active=true ORDER BY ac.account_code
    `);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { department_id, account_code, account_name, entry_type, category } = await request.json();
  try {
    const r = await pool.query(
      'INSERT INTO account_codes (department_id, account_code, account_name, entry_type, category) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [department_id, account_code, account_name, entry_type, category]
    );
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Account code created' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
