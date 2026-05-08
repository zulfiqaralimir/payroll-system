import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query('SELECT id, name, email, role, is_active, last_login, created_at FROM users ORDER BY role, name');
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { name, email, role } = await request.json();
  const tempPassword = await bcrypt.hash('Admin@123', 10);
  try {
    const r = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role',
      [name, email, tempPassword, role || 'hr_manager']
    );
    return NextResponse.json({ success: true, data: r.rows[0], message: 'User created. Temp password: Admin@123' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
