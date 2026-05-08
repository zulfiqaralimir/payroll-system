import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmt(n) { return Number(n||0).toLocaleString('en-PK', { minimumFractionDigits: 0 }); }

export async function GET(request, { params }) {
  const { payrollRunId } = await params;
  try {
    const r = await pool.query(`
      SELECT pr.*, e.employee_id AS employee_id_code, e.name, e.designation, e.bank_name, e.bank_account,
             e.pf_member, e.eobi_applicable, d.name AS department_name,
             ma.overtime_normal_hours, ma.overtime_holiday_hours, ma.rig_bonus_days_1, ma.rig_bonus_days_2, ma.travelling_days
      FROM payroll_runs pr JOIN employees e ON pr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN monthly_attendance ma ON ma.employee_id = e.id AND ma.month = pr.month AND ma.year = pr.year
      WHERE pr.id=$1
    `, [payrollRunId]);
    if (!r.rows[0]) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const row = r.rows[0];
    const period = `${MONTHS[row.month - 1]} ${row.year}`;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Payslip</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;max-width:800px;margin:0 auto}
    h2{color:#1a1a2e;text-align:center}.header{background:#1a1a2e;color:white;padding:15px;border-radius:8px;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;margin:10px 0}td,th{padding:8px;border:1px solid #ddd}
    th{background:#f4f4f4}.total{font-weight:bold;background:#e8f4e8}.net{font-size:1.2em;font-weight:bold;color:#1a1a2e}</style>
    </head><body>
    <div class="header"><h2>WellServe Oilfield Services (Pvt) Ltd</h2><p style="text-align:center">Salary Slip — ${period}</p></div>
    <table><tr><td><b>Employee ID:</b> ${row.employee_id_code}</td><td><b>Name:</b> ${row.name}</td></tr>
    <tr><td><b>Designation:</b> ${row.designation||'-'}</td><td><b>Department:</b> ${row.department_name||'-'}</td></tr>
    <tr><td><b>Bank:</b> ${row.bank_name||'-'}</td><td><b>Account:</b> ${row.bank_account||'-'}</td></tr></table>
    <table><tr><th>Earnings</th><th>PKR</th><th>Deductions</th><th>PKR</th></tr>
    <tr><td>Basic Pay</td><td>${fmt(row.basic_pay)}</td><td>EOBI</td><td>${fmt(row.eobi)}</td></tr>
    <tr><td>House Rent (${fmt(row.house_rent_allowance)})</td><td>${fmt(row.house_rent_allowance)}</td><td>Income Tax</td><td>${fmt(row.income_tax)}</td></tr>
    <tr><td>Utility Allowance</td><td>${fmt(row.utility_allowance)}</td><td>Provident Fund</td><td>${fmt(row.provident_fund)}</td></tr>
    <tr><td>Conveyance</td><td>${fmt(row.conveyance_allowance)}</td><td>Loan Deduction</td><td>${fmt(row.loan_deduction)}</td></tr>
    <tr><td>Overtime</td><td>${fmt(row.overtime_amount)}</td><td>Absent Deduction</td><td>${fmt(row.absent_deduction)}</td></tr>
    <tr><td>Rig Bonus</td><td>${fmt(row.rig_bonus_amount)}</td><td>Other Deductions</td><td>${fmt(row.other_deductions)}</td></tr>
    <tr><td>Arrears</td><td>${fmt(row.arrears)}</td><td></td><td></td></tr>
    <tr class="total"><td>Gross Salary</td><td>${fmt(row.gross_salary)}</td><td>Total Deductions</td><td>${fmt(row.total_deductions)}</td></tr></table>
    <table><tr class="net"><td colspan="3" style="text-align:right">Net Salary (PKR):</td><td>${fmt(row.net_salary)}</td></tr></table>
    </body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
