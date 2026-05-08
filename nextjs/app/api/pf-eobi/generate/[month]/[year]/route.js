import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request, { params }) {
  const { month, year } = await params;
  try {
    const payroll = (await pool.query(
      'SELECT pr.*, e.pf_member, e.eobi_applicable FROM payroll_runs pr JOIN employees e ON pr.employee_id = e.id WHERE pr.month=$1 AND pr.year=$2',
      [month, year]
    )).rows;
    let created = 0;
    for (const row of payroll) {
      const empShare = parseFloat(row.provident_fund) || 0;
      await pool.query(`
        INSERT INTO pf_eobi_report
          (employee_id, month, year, pf_employee_share, pf_employer_share, pf_loan_deduction, pf_total, eobi_employee_share, eobi_employer_share, eobi_total)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (employee_id, month, year) DO UPDATE SET
          pf_employee_share=$4, pf_employer_share=$5, pf_loan_deduction=$6, pf_total=$7,
          eobi_employee_share=$8, eobi_employer_share=$9, eobi_total=$10
      `, [
        row.employee_id, month, year, empShare, empShare, parseFloat(row.pf_loan)||0, empShare * 2,
        row.eobi_applicable ? 320 : 0, row.eobi_applicable ? 1600 : 0, row.eobi_applicable ? 1920 : 0
      ]);
      created++;
    }
    return NextResponse.json({ success: true, message: `${created} PF/EOBI records generated` });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
