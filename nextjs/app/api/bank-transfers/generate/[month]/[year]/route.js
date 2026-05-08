import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request, { params }) {
  const { month, year } = await params;
  try {
    const payroll = (await pool.query(
      "SELECT pr.*, e.bank_name, e.bank_account, e.mode_of_payment FROM payroll_runs pr JOIN employees e ON pr.employee_id = e.id WHERE pr.month=$1 AND pr.year=$2 AND pr.status='approved'",
      [month, year]
    )).rows;
    let created = 0;
    for (const row of payroll) {
      const bank = (await pool.query('SELECT id FROM banks WHERE name=$1 OR short_name=$1', [row.bank_name])).rows[0];
      await pool.query(
        'INSERT INTO bank_transfers (payroll_id, employee_id, bank_id, account_no, amount, month, year, transfer_mode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING',
        [row.id, row.employee_id, bank?.id||null, row.bank_account, row.net_salary, month, year, row.mode_of_payment||'bank']
      );
      created++;
    }
    return NextResponse.json({ success: true, message: `${created} bank transfers generated` });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
