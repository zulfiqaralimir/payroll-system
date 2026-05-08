import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request) {
  const decoded = verifyToken(request);
  if (!decoded)
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

  try {
    const r = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id=$1 AND is_active=true', [decoded.id]
    );
    if (!r.rows[0])
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 });

    return NextResponse.json({ success: true, user: r.rows[0] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
