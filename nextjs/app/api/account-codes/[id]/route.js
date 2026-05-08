import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request, { params }) {
  const { id } = await params;
  const { department_id, account_code, account_name, entry_type, category } = await request.json();
  try {
    const r = await pool.query(
      'UPDATE account_codes SET department_id=$1, account_code=$2, account_name=$3, entry_type=$4, category=$5 WHERE id=$6 RETURNING *',
      [department_id, account_code, account_name, entry_type, category, id]
    );
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Updated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await pool.query('UPDATE account_codes SET is_active=false WHERE id=$1', [id]);
    return NextResponse.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
