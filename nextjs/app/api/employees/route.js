import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT e.*, d.name AS department_name, d.staff_type
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.is_active = true
      ORDER BY e.employee_id
    `);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const {
    employee_id, name, designation, department_id, cnic,
    father_name, mother_name, date_of_joining, employment_type,
    bank_name, bank_account, mode_of_payment, pf_member, eobi_applicable,
    religion, rig_bonus_eligible
  } = await request.json();
  if (!employee_id || !name || !designation || !department_id)
    return NextResponse.json({ success: false, error: 'employee_id, name, designation and department_id are required' }, { status: 400 });
  try {
    const exists = await pool.query('SELECT id FROM employees WHERE employee_id=$1', [employee_id]);
    if (exists.rows[0])
      return NextResponse.json({ success: false, error: `Employee ID ${employee_id} already exists` }, { status: 409 });

    const r = await pool.query(`
      INSERT INTO employees
        (employee_id, name, designation, department_id, cnic,
         father_name, mother_name, date_of_joining, employment_type,
         bank_name, bank_account, mode_of_payment, pf_member, eobi_applicable,
         religion, rig_bonus_eligible)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *
    `, [
      employee_id, name, designation, department_id, cnic || null,
      father_name || null, mother_name || null, date_of_joining || null,
      employment_type || 'permanent', bank_name || null, bank_account || null,
      mode_of_payment || 'bank', pf_member || false, eobi_applicable !== false,
      religion || null, rig_bonus_eligible !== false
    ]);
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Employee created successfully' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
