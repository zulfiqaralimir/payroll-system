import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT ma.*, e.employee_id AS emp_code, e.name AS emp_name, d.name AS department_name
      FROM monthly_attendance ma
      JOIN employees e ON ma.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY ma.year DESC, ma.month DESC, e.employee_id
    `);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const {
    employee_id, month, year, absent_days, late_coming_hours, leave_without_pay,
    overtime_normal_hours, overtime_holiday_hours, rig_bonus_days_1, rig_bonus_days_2,
    travelling_days, advance_salary, meal_allowance, arrears, reimbursement,
    tax_adjustment, annual_bonus, loan_deduction, pf_loan, other_deductions
  } = await request.json();
  try {
    const r = await pool.query(`
      INSERT INTO monthly_attendance
        (employee_id, month, year, absent_days, late_coming_hours, leave_without_pay,
         overtime_normal_hours, overtime_holiday_hours, rig_bonus_days_1, rig_bonus_days_2,
         travelling_days, advance_salary, meal_allowance, arrears, reimbursement,
         tax_adjustment, annual_bonus, loan_deduction, pf_loan, other_deductions)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      ON CONFLICT (employee_id, month, year) DO UPDATE SET
        absent_days=$4, late_coming_hours=$5, leave_without_pay=$6,
        overtime_normal_hours=$7, overtime_holiday_hours=$8,
        rig_bonus_days_1=$9, rig_bonus_days_2=$10, travelling_days=$11,
        advance_salary=$12, meal_allowance=$13, arrears=$14, reimbursement=$15,
        tax_adjustment=$16, annual_bonus=$17, loan_deduction=$18,
        pf_loan=$19, other_deductions=$20, updated_at=NOW()
      RETURNING *
    `, [
      employee_id, month, year,
      absent_days||0, late_coming_hours||0, leave_without_pay||0,
      overtime_normal_hours||0, overtime_holiday_hours||0,
      rig_bonus_days_1||0, rig_bonus_days_2||0, travelling_days||0,
      advance_salary||0, meal_allowance||0, arrears||0, reimbursement||0,
      tax_adjustment||0, annual_bonus||0, loan_deduction||0, pf_loan||0, other_deductions||0
    ]);
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Attendance saved' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
