import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT pe.*, e.employee_id AS emp_code, e.name AS emp_name, ps.name AS scheme_name
      FROM pf_eobi_report pe JOIN employees e ON pe.employee_id = e.id
      LEFT JOIN pf_schemes ps ON pe.pf_scheme_id = ps.id
      ORDER BY pe.year DESC, pe.month DESC, e.employee_id
    `);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
