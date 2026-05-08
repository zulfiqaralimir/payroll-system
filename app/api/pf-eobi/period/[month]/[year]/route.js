import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { month, year } = await params;
  try {
    const r = await pool.query(`
      SELECT pe.*, e.employee_id AS emp_code, e.name AS emp_name, ps.name AS scheme_name
      FROM pf_eobi_report pe JOIN employees e ON pe.employee_id = e.id
      LEFT JOIN pf_schemes ps ON pe.pf_scheme_id = ps.id
      WHERE pe.month=$1 AND pe.year=$2 ORDER BY e.employee_id
    `, [month, year]);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
