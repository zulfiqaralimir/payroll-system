import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const { month, year } = await params;
  try {
    const summary = (await pool.query(`
      SELECT COUNT(*) AS total_employees, SUM(basic_pay) AS total_basic, SUM(house_rent_allowance) AS total_hra,
             SUM(utility_allowance) AS total_utility, SUM(conveyance_allowance) AS total_conveyance,
             SUM(overtime_amount) AS total_overtime, SUM(rig_bonus_amount) AS total_rig_bonus,
             SUM(travelling_amount) AS total_travelling, SUM(annual_bonus) AS total_annual_bonus,
             SUM(arrears) AS total_arrears, SUM(reimbursement) AS total_reimbursement,
             SUM(gross_salary) AS total_gross, SUM(eobi) AS total_eobi, SUM(income_tax) AS total_tax,
             SUM(provident_fund) AS total_pf, SUM(loan_deduction) AS total_loans,
             SUM(absent_deduction) AS total_absent_ded, SUM(total_deductions) AS total_deductions,
             SUM(net_salary) AS total_net, MAX(status) AS status
      FROM payroll_runs WHERE month=$1 AND year=$2
    `, [month, year])).rows[0];
    const byDept = (await pool.query(`
      SELECT d.name AS department, d.staff_type, COUNT(pr.id) AS employees,
             SUM(pr.gross_salary) AS total_gross, SUM(pr.net_salary) AS total_net,
             SUM(pr.eobi) AS total_eobi, SUM(pr.provident_fund) AS total_pf, SUM(pr.income_tax) AS total_tax
      FROM payroll_runs pr JOIN employees e ON pr.employee_id = e.id JOIN departments d ON e.department_id = d.id
      WHERE pr.month=$1 AND pr.year=$2 GROUP BY d.id, d.name, d.staff_type ORDER BY d.staff_type, d.name
    `, [month, year])).rows;
    const byStaffType = (await pool.query(`
      SELECT d.staff_type, COUNT(pr.id) AS employees, SUM(pr.gross_salary) AS total_gross, SUM(pr.net_salary) AS total_net
      FROM payroll_runs pr JOIN employees e ON pr.employee_id = e.id JOIN departments d ON e.department_id = d.id
      WHERE pr.month=$1 AND pr.year=$2 GROUP BY d.staff_type
    `, [month, year])).rows;
    return NextResponse.json({ success: true, data: { summary, byDepartment: byDept, byStaffType }, message: `Monthly report for ${month}/${year}` });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
