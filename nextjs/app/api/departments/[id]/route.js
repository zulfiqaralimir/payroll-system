import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const r = await pool.query('SELECT * FROM departments WHERE id=$1', [id]);
    if (!r.rows[0]) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: r.rows[0] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const { name, staff_type, description } = await request.json();
  try {
    const r = await pool.query(
      'UPDATE departments SET name=$1, staff_type=$2, description=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [name, staff_type, description, id]
    );
    if (!r.rows[0]) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Department updated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const r = await pool.query(
      'UPDATE departments SET is_active=false, updated_at=NOW() WHERE id=$1 RETURNING *', [id]
    );
    if (!r.rows[0]) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Department deactivated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
