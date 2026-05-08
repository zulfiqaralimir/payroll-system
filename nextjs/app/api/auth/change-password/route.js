import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request) {
  const { userId, oldPassword, newPassword } = await request.json();
  if (!userId || !oldPassword || !newPassword)
    return NextResponse.json({ success: false, error: 'userId, oldPassword and newPassword are required' }, { status: 400 });
  if (newPassword.length < 8)
    return NextResponse.json({ success: false, error: 'New password must be at least 8 characters' }, { status: 400 });

  try {
    const result = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);
    if (!result.rows[0])
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const user = result.rows[0];
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid)
      return NextResponse.json({ success: false, error: 'Wrong password' }, { status: 401 });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2', [hash, userId]);
    await pool.query(
      'INSERT INTO audit_log (user_id, action, table_name) VALUES ($1,$2,$3)',
      [userId, 'CHANGE_PASSWORD', 'users']
    );

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
