import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  const { userId } = await request.json();
  try {
    if (userId) {
      await pool.query(
        'INSERT INTO audit_log (user_id, action, table_name) VALUES ($1,$2,$3)',
        [userId, 'LOGOUT', 'users']
      );
    }
    return NextResponse.json({ success: true, message: 'Logged out' });
  } catch {
    return NextResponse.json({ success: true, message: 'Logged out' });
  }
}
