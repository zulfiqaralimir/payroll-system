import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function POST(request) {
  const { email, password } = await request.json();
  if (!email || !password)
    return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND is_active=true', [email]
    );
    if (result.rows.length === 0)
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await pool.query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);
    await pool.query(
      'INSERT INTO audit_log (user_id, action, table_name) VALUES ($1,$2,$3)',
      [user.id, 'LOGIN', 'users']
    );

    return NextResponse.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
