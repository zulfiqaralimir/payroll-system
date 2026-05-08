import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT al.*, u.name AS user_name, u.role AS user_role FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id ORDER BY al.performed_at DESC LIMIT 500
    `);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { user_id, action, table_name, record_id, old_values, new_values } = await request.json();
  try {
    const r = await pool.query(
      'INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [user_id, action, table_name, record_id, old_values ? JSON.stringify(old_values) : null, new_values ? JSON.stringify(new_values) : null]
    );
    return NextResponse.json({ success: true, data: r.rows[0] }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
