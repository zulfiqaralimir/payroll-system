import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request, { params }) {
  const { month, year } = await params;
  try {
    await pool.query('DELETE FROM jv_entries WHERE month=$1 AND year=$2', [month, year]);
    const deptTotals = (await pool.query(`
      SELECT d.id AS dept_id, d.name AS dept_name,
             SUM(pr.basic_pay + pr.house_rent_allowance + pr.utility_allowance + pr.conveyance_allowance) AS salary_total,
             SUM(pr.net_salary) AS net_total, SUM(pr.eobi) AS eobi_total, SUM(pr.provident_fund) AS pf_total
      FROM payroll_runs pr JOIN employees e ON pr.employee_id = e.id JOIN departments d ON e.department_id = d.id
      WHERE pr.month=$1 AND pr.year=$2 GROUP BY d.id, d.name
    `, [month, year])).rows;

    let created = 0;
    for (const dept of deptTotals) {
      const ac = (await pool.query(
        "SELECT * FROM account_codes WHERE department_id=$1 AND category='salary' AND entry_type='debit' LIMIT 1", [dept.dept_id]
      )).rows[0];
      await pool.query(
        'INSERT INTO jv_entries (month, year, department_id, account_code_id, account_code, account_name, debit_amount, transaction_no, description) VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8)',
        [month, year, dept.dept_id, ac?.id||null, ac?.account_code||'', dept.dept_name + ' Salaries', dept.salary_total, `${dept.dept_name} — Salary Transaction`]
      );
      created++;
    }
    const totals = (await pool.query(
      'SELECT SUM(eobi) AS total_eobi, SUM(provident_fund) AS total_pf, SUM(net_salary) AS total_net FROM payroll_runs WHERE month=$1 AND year=$2',
      [month, year]
    )).rows[0];
    await pool.query("INSERT INTO jv_entries (month,year,account_code,account_name,credit_amount,transaction_no,description) VALUES ($1,$2,'8024','EOBI Payable',$3,2,'EOBI Employee Contribution')", [month, year, totals.total_eobi]);
    await pool.query("INSERT INTO jv_entries (month,year,account_code,account_name,credit_amount,transaction_no,description) VALUES ($1,$2,'8031','Provident Fund Payable',$3,3,'PF Employee Contribution')", [month, year, totals.total_pf]);
    await pool.query("INSERT INTO jv_entries (month,year,account_code,account_name,credit_amount,transaction_no,description) VALUES ($1,$2,'8030','Net Salary Payable',$3,1,'Net Salaries Payable')", [month, year, totals.total_net]);

    return NextResponse.json({ success: true, message: `JV entries generated (${created} departments)` });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
