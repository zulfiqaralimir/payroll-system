import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request, { params }) {
  const { id } = await params;
  const { name, short_name, employee_rate, employer_rate, scheme_type, trustee } = await request.json();
  try {
    const r = await pool.query(
      'UPDATE pf_schemes SET name=$1, short_name=$2, employee_rate=$3, employer_rate=$4, scheme_type=$5, trustee=$6 WHERE id=$7 RETURNING *',
      [name, short_name, employee_rate, employer_rate, scheme_type, trustee, id]
    );
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Updated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await pool.query('UPDATE pf_schemes SET is_active=false WHERE id=$1', [id]);
    return NextResponse.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
