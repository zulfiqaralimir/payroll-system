import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT bt.*, e.employee_id AS emp_code, e.name AS emp_name, b.name AS bank_name, b.short_name AS bank_short
      FROM bank_transfers bt JOIN employees e ON bt.employee_id = e.id
      LEFT JOIN banks b ON bt.bank_id = b.id ORDER BY bt.year DESC, bt.month DESC
    `);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
