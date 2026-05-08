import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { error } = requireAuth(request, ['admin', 'cfo']);
  if (error) return error;
  const { userId } = await params;

  try {
    const [granted, all] = await Promise.all([
      pool.query('SELECT department_id FROM user_department_access WHERE user_id=$1', [userId]),
      pool.query('SELECT id, name, staff_type FROM departments ORDER BY staff_type, name'),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        granted: granted.rows.map(r => r.department_id),
        departments: all.rows,
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { error } = requireAuth(request, ['cfo']);
  if (error) return error;
  const { userId } = await params;
  const { department_ids } = await request.json();

  try {
    await pool.query('DELETE FROM user_department_access WHERE user_id=$1', [userId]);
    for (const deptId of (department_ids || [])) {
      await pool.query(
        'INSERT INTO user_department_access (user_id, department_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [userId, deptId]
      );
    }
    return NextResponse.json({ success: true, message: 'Department access saved' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
