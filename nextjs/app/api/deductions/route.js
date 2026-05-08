import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT md.*, e.employee_id AS emp_code, e.name AS emp_name
      FROM monthly_deductions md
      JOIN employees e ON md.employee_id = e.id
      ORDER BY md.year DESC, md.month DESC, e.employee_id
    `);
    return NextResponse.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { employee_id, month, year, eobi, income_tax, provident_fund, loan_deduction, pf_loan, other_deductions } = await request.json();
  const total = (eobi||320) + (income_tax||0) + (provident_fund||0) + (loan_deduction||0) + (pf_loan||0) + (other_deductions||0);
  try {
    const r = await pool.query(`
      INSERT INTO monthly_deductions
        (employee_id, month, year, eobi, income_tax, provident_fund, loan_deduction, pf_loan, other_deductions, total_deductions)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (employee_id, month, year) DO UPDATE SET
        eobi=$4, income_tax=$5, provident_fund=$6, loan_deduction=$7,
        pf_loan=$8, other_deductions=$9, total_deductions=$10, updated_at=NOW()
      RETURNING *
    `, [employee_id, month, year, eobi||320, income_tax||0, provident_fund||0, loan_deduction||0, pf_loan||0, other_deductions||0, total]);
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Deductions saved' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
