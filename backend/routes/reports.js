const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });
  next();
};

const monthYearRules = [
  param('month').isInt({ min: 1, max: 12 }).withMessage('month must be 1–12'),
  param('year').isInt({ min: 2020, max: 2099 }).withMessage('year must be 2020–2099'),
];

// GET /api/reports/monthly/:month/:year — full monthly payroll summary
router.get('/monthly/:month/:year', monthYearRules, validate, async (req, res) => {
  const { month, year } = req.params;
  try {
    // Overall summary
    const summary = (await pool.query(`
      SELECT
        COUNT(*) AS total_employees,
        SUM(basic_pay)             AS total_basic,
        SUM(house_rent_allowance)  AS total_hra,
        SUM(utility_allowance)     AS total_utility,
        SUM(conveyance_allowance)  AS total_conveyance,
        SUM(overtime_amount)       AS total_overtime,
        SUM(rig_bonus_amount)      AS total_rig_bonus,
        SUM(travelling_amount)     AS total_travelling,
        SUM(annual_bonus)          AS total_annual_bonus,
        SUM(arrears)               AS total_arrears,
        SUM(reimbursement)         AS total_reimbursement,
        SUM(gross_salary)          AS total_gross,
        SUM(eobi)                  AS total_eobi,
        SUM(income_tax)            AS total_tax,
        SUM(provident_fund)        AS total_pf,
        SUM(loan_deduction)        AS total_loans,
        SUM(absent_deduction)      AS total_absent_ded,
        SUM(total_deductions)      AS total_deductions,
        SUM(net_salary)            AS total_net,
        MAX(status)                AS status
      FROM payroll_runs
      WHERE month=$1 AND year=$2
    `, [month, year])).rows[0];

    // By department
    const byDept = (await pool.query(`
      SELECT d.name AS department, d.staff_type,
             COUNT(pr.id) AS employees,
             SUM(pr.gross_salary) AS total_gross,
             SUM(pr.net_salary)   AS total_net,
             SUM(pr.eobi)         AS total_eobi,
             SUM(pr.provident_fund) AS total_pf,
             SUM(pr.income_tax)   AS total_tax
      FROM payroll_runs pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      WHERE pr.month=$1 AND pr.year=$2
      GROUP BY d.id, d.name, d.staff_type
      ORDER BY d.staff_type, d.name
    `, [month, year])).rows;

    // Admin vs Direct split
    const byStaffType = (await pool.query(`
      SELECT d.staff_type,
             COUNT(pr.id) AS employees,
             SUM(pr.gross_salary) AS total_gross,
             SUM(pr.net_salary)   AS total_net
      FROM payroll_runs pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      WHERE pr.month=$1 AND pr.year=$2
      GROUP BY d.staff_type
    `, [month, year])).rows;

    res.json({
      success: true,
      data: { summary, byDepartment: byDept, byStaffType },
      message: `Monthly report for ${month}/${year}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/jv/:month/:year — JV entries
router.get('/jv/:month/:year', monthYearRules, validate, async (req, res) => {
  const { month, year } = req.params;
  try {
    const r = await pool.query(`
      SELECT jv.*, d.name AS department_name
      FROM jv_entries jv
      LEFT JOIN departments d ON jv.department_id = d.id
      WHERE jv.month=$1 AND jv.year=$2
      ORDER BY jv.transaction_no, jv.account_code
    `, [month, year]);

    const totals = (await pool.query(`
      SELECT SUM(debit_amount) AS total_debit, SUM(credit_amount) AS total_credit
      FROM jv_entries WHERE month=$1 AND year=$2
    `, [month, year])).rows[0];

    res.json({
      success: true,
      data: r.rows,
      totals,
      count: r.rowCount,
      message: `JV entries for ${month}/${year}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/bank-transfers/:month/:year — bank transfer list grouped by bank
router.get('/bank-transfers/:month/:year', monthYearRules, validate, async (req, res) => {
  const { month, year } = req.params;
  try {
    const r = await pool.query(`
      SELECT bt.*, e.employee_id AS emp_code, e.name AS emp_name,
             e.bank_account, b.name AS bank_name, b.short_name AS bank_short,
             d.name AS department_name
      FROM bank_transfers bt
      JOIN employees e ON bt.employee_id = e.id
      LEFT JOIN banks b ON bt.bank_id = b.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE bt.month=$1 AND bt.year=$2
      ORDER BY b.short_name, e.employee_id
    `, [month, year]);

    const byBank = (await pool.query(`
      SELECT b.short_name AS bank, b.name AS bank_name,
             COUNT(bt.id) AS employees, SUM(bt.amount) AS total_amount
      FROM bank_transfers bt
      LEFT JOIN banks b ON bt.bank_id = b.id
      WHERE bt.month=$1 AND bt.year=$2
      GROUP BY b.id, b.short_name, b.name
      ORDER BY b.short_name
    `, [month, year])).rows;

    res.json({
      success: true,
      data: r.rows,
      byBank,
      count: r.rowCount,
      message: `Bank transfer list for ${month}/${year}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/pf-eobi/:month/:year — PF and EOBI report
router.get('/pf-eobi/:month/:year', monthYearRules, validate, async (req, res) => {
  const { month, year } = req.params;
  try {
    const r = await pool.query(`
      SELECT pe.*, e.employee_id AS emp_code, e.name AS emp_name,
             e.cnic, d.name AS department_name
      FROM pf_eobi_report pe
      JOIN employees e ON pe.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE pe.month=$1 AND pe.year=$2
      ORDER BY e.employee_id
    `, [month, year]);

    const totals = (await pool.query(`
      SELECT
        SUM(pf_employee_share)  AS total_pf_employee,
        SUM(pf_employer_share)  AS total_pf_employer,
        SUM(pf_total)           AS total_pf,
        SUM(eobi_employee_share) AS total_eobi_employee,
        SUM(eobi_employer_share) AS total_eobi_employer,
        SUM(eobi_total)         AS total_eobi
      FROM pf_eobi_report WHERE month=$1 AND year=$2
    `, [month, year])).rows[0];

    res.json({
      success: true,
      data: r.rows,
      totals,
      count: r.rowCount,
      message: `PF/EOBI report for ${month}/${year}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/employees — employee headcount summary
router.get('/employees', async (req, res) => {
  try {
    const byDept = (await pool.query(`
      SELECT d.name AS department, d.staff_type,
             COUNT(e.id) AS total,
             COUNT(e.id) FILTER (WHERE e.is_active=true)  AS active,
             COUNT(e.id) FILTER (WHERE e.is_active=false) AS inactive
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      GROUP BY d.id, d.name, d.staff_type
      ORDER BY d.staff_type, d.name
    `)).rows;

    const overall = (await pool.query(`
      SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE is_active=true)  AS active,
             COUNT(*) FILTER (WHERE is_active=false) AS inactive,
             COUNT(*) FILTER (WHERE pf_member=true)  AS pf_members,
             COUNT(*) FILTER (WHERE eobi_applicable=true) AS eobi_members
      FROM employees
    `)).rows[0];

    res.json({ success: true, data: { overall, byDepartment: byDept } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/dashboard — dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const [empRow, deptRow, pendingRow, periodsRaw, deptCostRaw, trendRaw] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM employees WHERE is_active=true`),
      pool.query(`SELECT COUNT(*) AS total FROM departments WHERE is_active=true`),
      pool.query(`SELECT COUNT(DISTINCT month||'-'||year) AS cnt FROM payroll_runs WHERE status='submitted'`),
      pool.query(`
        SELECT month, year, status, COUNT(*) AS employees,
               SUM(gross_salary) AS total_gross, SUM(net_salary) AS total_net
        FROM payroll_runs
        GROUP BY month, year, status
        ORDER BY year DESC, month DESC LIMIT 6
      `),
      pool.query(`
        SELECT d.name AS department, d.staff_type,
               SUM(pr.net_salary) AS total_net, COUNT(pr.id) AS employees
        FROM payroll_runs pr
        JOIN employees e ON pr.employee_id = e.id
        JOIN departments d ON e.department_id = d.id
        WHERE (pr.month, pr.year) = (
          SELECT month, year FROM payroll_runs ORDER BY year DESC, month DESC LIMIT 1
        )
        GROUP BY d.id, d.name, d.staff_type
        ORDER BY total_net DESC
      `),
      pool.query(`
        SELECT month, year,
               SUM(gross_salary) AS total_gross,
               SUM(net_salary)   AS total_net,
               SUM(total_deductions) AS total_deductions,
               COUNT(*) AS employees
        FROM payroll_runs
        GROUP BY month, year
        ORDER BY year ASC, month ASC
        LIMIT 12
      `)
    ]);

    const recentPayrolls = periodsRaw.rows;
    const latest = recentPayrolls[0];

    res.json({
      success: true,
      data: {
        activeEmployees:   empRow.rows[0].total,
        activeDepartments: deptRow.rows[0].total,
        pendingApprovals:  pendingRow.rows[0].cnt,
        thisMonthNet:      latest?.total_net || 0,
        thisMonthGross:    latest?.total_gross || 0,
        thisMonthEmployees: latest?.employees || 0,
        thisMonthStatus:   latest?.status || null,
        thisMonthLabel:    latest ? `${latest.month}/${latest.year}` : null,
        recentPayrolls,
        departmentCosts:   deptCostRaw.rows,
        monthlyTrend:      trendRaw.rows,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/tax/:month/:year — income tax report per employee
router.get('/tax/:month/:year', monthYearRules, validate, async (req, res) => {
  const { month, year } = req.params;
  try {
    const r = await pool.query(`
      SELECT e.employee_id AS emp_code, e.name AS emp_name, e.cnic,
             d.name AS department,
             pr.basic_pay, pr.gross_salary,
             pr.income_tax, pr.income_tax * 12 AS annual_tax_projection,
             pr.status
      FROM payroll_runs pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      WHERE pr.month=$1 AND pr.year=$2
      ORDER BY pr.income_tax DESC
    `, [month, year]);

    const totals = (await pool.query(`
      SELECT SUM(income_tax) AS total_tax,
             SUM(income_tax*12) AS total_annual_projection,
             COUNT(*) FILTER (WHERE income_tax > 0) AS taxable_employees,
             COUNT(*) AS total_employees
      FROM payroll_runs WHERE month=$1 AND year=$2
    `, [month, year])).rows[0];

    res.json({ success: true, data: r.rows, totals, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
