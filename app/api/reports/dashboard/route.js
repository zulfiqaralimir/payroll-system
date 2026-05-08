import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [empRow, deptRow, pendingRow, periodsRaw, deptCostRaw, trendRaw] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM employees WHERE is_active=true'),
      pool.query('SELECT COUNT(*) AS total FROM departments WHERE is_active=true'),
      pool.query("SELECT COUNT(DISTINCT month||'-'||year) AS cnt FROM payroll_runs WHERE status='submitted'"),
      pool.query('SELECT month, year, status, COUNT(*) AS employees, SUM(gross_salary) AS total_gross, SUM(net_salary) AS total_net FROM payroll_runs GROUP BY month, year, status ORDER BY year DESC, month DESC LIMIT 6'),
      pool.query(`SELECT d.name AS department, d.staff_type, SUM(pr.net_salary) AS total_net, COUNT(pr.id) AS employees FROM payroll_runs pr JOIN employees e ON pr.employee_id = e.id JOIN departments d ON e.department_id = d.id WHERE (pr.month, pr.year) = (SELECT month, year FROM payroll_runs ORDER BY year DESC, month DESC LIMIT 1) GROUP BY d.id, d.name, d.staff_type ORDER BY total_net DESC`),
      pool.query('SELECT month, year, SUM(gross_salary) AS total_gross, SUM(net_salary) AS total_net, SUM(total_deductions) AS total_deductions, COUNT(*) AS employees FROM payroll_runs GROUP BY month, year ORDER BY year ASC, month ASC LIMIT 12')
    ]);
    const recentPayrolls = periodsRaw.rows;
    const latest = recentPayrolls[0];
    return NextResponse.json({
      success: true,
      data: {
        activeEmployees: empRow.rows[0].total, activeDepartments: deptRow.rows[0].total,
        pendingApprovals: pendingRow.rows[0].cnt, thisMonthNet: latest?.total_net||0,
        thisMonthGross: latest?.total_gross||0, thisMonthEmployees: latest?.employees||0,
        thisMonthStatus: latest?.status||null, thisMonthLabel: latest ? `${latest.month}/${latest.year}` : null,
        recentPayrolls, departmentCosts: deptCostRaw.rows, monthlyTrend: trendRaw.rows
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
