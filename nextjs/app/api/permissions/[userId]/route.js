import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import pool from '@/lib/db';

const MODULES = ['dashboard','employees','salary_structures','attendance','payroll','payslips','approvals','reports','users','database','settings'];

export async function GET(request, { params }) {
  const { error } = requireAuth(request, ['admin', 'cfo']);
  if (error) return error;
  const { userId } = await params;

  try {
    const r = await pool.query(
      'SELECT module, can_view, can_edit, can_delete, can_approve FROM user_permissions WHERE user_id=$1',
      [userId]
    );
    const perms = {};
    MODULES.forEach(m => { perms[m] = { can_view: false, can_edit: false, can_delete: false, can_approve: false }; });
    r.rows.forEach(row => { perms[row.module] = { can_view: row.can_view, can_edit: row.can_edit, can_delete: row.can_delete, can_approve: row.can_approve }; });
    return NextResponse.json({ success: true, data: perms });
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
    for (const [module, perms] of Object.entries(body)) {
      if (!MODULES.includes(module)) continue;
      await pool.query(`
        INSERT INTO user_permissions (user_id, module, can_view, can_edit, can_delete, can_approve, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,NOW())
        ON CONFLICT (user_id, module) DO UPDATE
        SET can_view=$3, can_edit=$4, can_delete=$5, can_approve=$6, updated_at=NOW()
      `, [userId, module, !!perms.can_view, !!perms.can_edit, !!perms.can_delete, !!perms.can_approve]);
    }
    return NextResponse.json({ success: true, message: 'Module permissions saved' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
