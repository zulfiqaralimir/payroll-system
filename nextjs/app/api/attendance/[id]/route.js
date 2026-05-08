import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request, { params }) {
  const { id } = await params;
  const {
    absent_days, late_coming_hours, leave_without_pay,
    overtime_normal_hours, overtime_holiday_hours, rig_bonus_days_1, rig_bonus_days_2,
    travelling_days, advance_salary, meal_allowance, arrears, reimbursement,
    tax_adjustment, annual_bonus, loan_deduction, pf_loan, other_deductions
  } = await request.json();
  try {
    const r = await pool.query(`
      UPDATE monthly_attendance SET
        absent_days=$1, late_coming_hours=$2, leave_without_pay=$3,
        overtime_normal_hours=$4, overtime_holiday_hours=$5,
        rig_bonus_days_1=$6, rig_bonus_days_2=$7, travelling_days=$8,
        advance_salary=$9, meal_allowance=$10, arrears=$11, reimbursement=$12,
        tax_adjustment=$13, annual_bonus=$14, loan_deduction=$15,
        pf_loan=$16, other_deductions=$17, updated_at=NOW()
      WHERE id=$18 RETURNING *
    `, [
      absent_days, late_coming_hours, leave_without_pay,
      overtime_normal_hours, overtime_holiday_hours,
      rig_bonus_days_1, rig_bonus_days_2, travelling_days,
      advance_salary, meal_allowance, arrears, reimbursement,
      tax_adjustment, annual_bonus, loan_deduction, pf_loan, other_deductions, id
    ]);
    if (!r.rows[0]) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Attendance updated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await pool.query('DELETE FROM monthly_attendance WHERE id=$1', [id]);
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
