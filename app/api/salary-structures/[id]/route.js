import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request, { params }) {
  const { id } = await params;
  const { basic_pay, hra_percentage, utility_percentage, conveyance_percentage } = await request.json();
  const per_day = basic_pay / 30;
  const hourly = per_day / 8;
  try {
    const r = await pool.query(`
      UPDATE salary_structures SET
        basic_pay=$1, hra_percentage=$2, utility_percentage=$3,
        conveyance_percentage=$4, per_day_rate=$5, hourly_rate=$6, updated_at=NOW()
      WHERE id=$7 RETURNING *
    `, [basic_pay, hra_percentage, utility_percentage, conveyance_percentage, per_day, hourly, id]);
    if (!r.rows[0]) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Salary structure updated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await pool.query('UPDATE salary_structures SET is_active=false WHERE id=$1', [id]);
    return NextResponse.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
