import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import pool from '@/lib/db';

const REPORTS = ['monthly_summary','department_cost','bank_transfers','pf_eobi','tax_report','jv_entries','ytd_report','loan_recovery'];

export async function GET(request, { params }) {
  const { error } = requireAuth(request, ['admin', 'cfo']);
  if (error) return error;
  const { userId } = await params;

  try {
    const r = await pool.query('SELECT report_name, can_view FROM user_report_access WHERE user_id=$1', [userId]);
    const reports = {};
    REPORTS.forEach(name => { reports[name] = false; });
    r.rows.forEach(row => { reports[row.report_name] = row.can_view; });
    return NextResponse.json({ success: true, data: reports });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { error } = requireAuth(request, ['cfo']);
  if (error) return error;
  const { userId } = await params;
  const body = await request.json();

  try {
    for (const [reportName, canView] of Object.entries(body)) {
      if (!REPORTS.includes(reportName)) continue;
      await pool.query(`
        INSERT INTO user_report_access (user_id, report_name, can_view, updated_at)
        VALUES ($1,$2,$3,NOW())
        ON CONFLICT (user_id, report_name) DO UPDATE
        SET can_view=$3, updated_at=NOW()
      `, [userId, reportName, !!canView]);
    }
    return NextResponse.json({ success: true, message: 'Report access saved' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
