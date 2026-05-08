import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request, { params }) {
  const { id } = await params;
  const { tax_year, min_income, max_income, tax_rate, fixed_tax, description } = await request.json();
  try {
    const r = await pool.query(
      'UPDATE tax_slabs SET tax_year=$1, min_income=$2, max_income=$3, tax_rate=$4, fixed_tax=$5, description=$6 WHERE id=$7 RETURNING *',
      [tax_year, min_income, max_income, tax_rate, fixed_tax, description, id]
    );
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Updated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await pool.query('UPDATE tax_slabs SET is_active=false WHERE id=$1', [id]);
    return NextResponse.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
