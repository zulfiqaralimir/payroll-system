import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request, { params }) {
  const { id } = await params;
  const { eobi, income_tax, provident_fund, loan_deduction, pf_loan, other_deductions } = await request.json();
  const total = (eobi||0) + (income_tax||0) + (provident_fund||0) + (loan_deduction||0) + (pf_loan||0) + (other_deductions||0);
  try {
    const r = await pool.query(`
      UPDATE monthly_deductions SET
        eobi=$1, income_tax=$2, provident_fund=$3, loan_deduction=$4,
        pf_loan=$5, other_deductions=$6, total_deductions=$7, updated_at=NOW()
      WHERE id=$8 RETURNING *
    `, [eobi, income_tax, provident_fund, loan_deduction, pf_loan, other_deductions, total, id]);
    return NextResponse.json({ success: true, data: r.rows[0], message: 'Updated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
