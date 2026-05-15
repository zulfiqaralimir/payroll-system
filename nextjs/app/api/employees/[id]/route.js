import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const r = await pool.query(`
      SELECT e.*, d.name AS department_name, d.staff_type
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id=$1
    `, [id]);
    if (!r.rows[0]) return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: r.rows[0] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const {
    employee_id, name, designation, department_id, cnic,
    father_name, mother_name, date_of_joining, employment_type,
    bank_name, bank_account, mode_of_payment, pf_member, eobi_applicable,
    religion, rig_bonus_eligible
  } = await request.json();
  try {
    const r = await pool.query(`
      UPDATE employees SET
        employee_id=$1, name=$2, designation=$3, department_id=$4, cnic=$5,
        father_name=$6, mother_name=$7, date_of_joining=$8, employment_type=$9,
        bank_name=$10, bank_account=$11, mode_of_payment=$12,
        pf_member=$13, eobi_applicable=$14, religion=$15, rig_bonus_eligible=$16,
        updated_at=NOW()
      WHERE id=$17 RETURNING *
    `, [
      employee_id, name, designation, department_id, cnic || null,
      father_name || null, mother_name || null, date_of_joining || null, employment_type,
      bank_name || null, bank_account || null, mode_of_payment,
      pf_member, eobi_applicable, religion || null, rig_bonus_eligible !== false,
      id
    ]);
    if (!r.rows[0]) return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Employee updated successfully' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const r = await pool.query(
      'UPDATE employees SET is_active=false, updated_at=NOW() WHERE id=$1 RETURNING id, employee_id, name', [id]
    );
    if (!r.rows[0]) return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Employee ${r.rows[0].employee_id} deactivated` });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
