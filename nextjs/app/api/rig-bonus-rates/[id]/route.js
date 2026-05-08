import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request, { params }) {
  const { id } = await params;
  const { rate_usd_1, rate_usd_2, usd_conv_rate } = await request.json();
  try {
    const r = await pool.query(
      'UPDATE rig_bonus_rates SET rate_usd_1=$1, rate_usd_2=$2, usd_conv_rate=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [rate_usd_1, rate_usd_2, usd_conv_rate, id]
    );
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Updated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await pool.query('UPDATE rig_bonus_rates SET is_active=false WHERE id=$1', [id]);
    return NextResponse.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
