import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const r = await pool.query('SELECT id, name, email, role, is_active, last_login FROM users WHERE id=$1', [id]);
    if (!r.rows[0]) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: r.rows[0] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const { name, email, role } = await request.json();
  try {
    const r = await pool.query(
      'UPDATE users SET name=$1, email=$2, role=$3, updated_at=NOW() WHERE id=$4 RETURNING id, name, email, role',
      [name, email, role, id]
    );
    return NextResponse.json({ success: true, data: r.rows[0], message: 'User updated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await pool.query('UPDATE users SET is_active=false, updated_at=NOW() WHERE id=$1', [id]);
    return NextResponse.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
