import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const byDept = (await pool.query(`
      SELECT d.name AS department, d.staff_type,
             COUNT(e.id) AS total,
             COUNT(e.id) FILTER (WHERE e.is_active=true) AS active,
             COUNT(e.id) FILTER (WHERE e.is_active=false) AS inactive
      FROM departments d LEFT JOIN employees e ON e.department_id = d.id
      GROUP BY d.id, d.name, d.staff_type ORDER BY d.staff_type, d.name
    `)).rows;
    const overall = (await pool.query(`
      SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_active=true) AS active,
             COUNT(*) FILTER (WHERE is_active=false) AS inactive,
             COUNT(*) FILTER (WHERE pf_member=true) AS pf_members,
             COUNT(*) FILTER (WHERE eobi_applicable=true) AS eobi_members FROM employees
    `)).rows[0];
    return NextResponse.json({ success: true, data: { overall, byDepartment: byDept } });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
