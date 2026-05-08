import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { month, year } = await params;
  try {
    const r = await pool.query(`
      SELECT bt.*, e.employee_id AS emp_code, e.name AS emp_name, e.bank_account,
             b.name AS bank_name, b.short_name AS bank_short, d.name AS department_name
      FROM bank_transfers bt JOIN employees e ON bt.employee_id = e.id
      LEFT JOIN banks b ON bt.bank_id = b.id LEFT JOIN departments d ON e.department_id = d.id
      WHERE bt.month=$1 AND bt.year=$2 ORDER BY b.short_name, e.employee_id
    `, [month, year]);
    const byBank = (await pool.query(`
      SELECT b.short_name AS bank, b.name AS bank_name, COUNT(bt.id) AS employees, SUM(bt.amount) AS total_amount
      FROM bank_transfers bt LEFT JOIN banks b ON bt.bank_id = b.id
      WHERE bt.month=$1 AND bt.year=$2 GROUP BY b.id, b.short_name, b.name ORDER BY b.short_name
    `, [month, year])).rows;
    return NextResponse.json({ success: true, data: r.rows, byBank, count: r.rowCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
