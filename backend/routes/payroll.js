const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { param, validationResult } = require('express-validator');
const { calculateGross, calculateDeductions } = require('../controllers/payrollController');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });
  next();
};

const monthYearRules = [
  param('month').isInt({ min: 1, max: 12 }).withMessage('month must be 1–12'),
  param('year').isInt({ min: 2020, max: 2099 }).withMessage('year must be 2020–2099'),
];

// GET all payroll periods (summary view)
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT month, year, status,
             COUNT(*) AS employees,
             SUM(gross_salary) AS total_gross,
             SUM(net_salary)   AS total_net
      FROM payroll_runs
      GROUP BY month, year, status
      ORDER BY year DESC, month DESC
    `);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET payroll history for one employee — must be before /:month/:year to avoid conflict
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM payroll_runs WHERE employee_id=$1 ORDER BY year DESC, month DESC',
      [req.params.employeeId]
    );
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET payroll detail for a specific month/year
router.get('/:month/:year', monthYearRules, validate, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT pr.*, e.employee_id AS emp_code, e.name AS emp_name,
             d.name AS department_name, d.staff_type
      FROM payroll_runs pr
      JOIN employees e ON pr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE pr.month=$1 AND pr.year=$2
      ORDER BY d.staff_type, e.employee_id
    `, [req.params.month, req.params.year]);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST run payroll calculation for month/year
router.post('/run/:month/:year', monthYearRules, validate, async (req, res) => {
  const { month, year } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Use exact year, or fall back to the most recent available tax year
    let taxSlabs = (await client.query(
      `SELECT * FROM tax_slabs WHERE is_active=true AND tax_year=$1 ORDER BY min_income`,
      [parseInt(year)]
    )).rows;

    if (taxSlabs.length === 0) {
      const fallback = await client.query(
        `SELECT * FROM tax_slabs WHERE is_active=true AND tax_year <= $1
         ORDER BY tax_year DESC, min_income`,
        [parseInt(year)]
      );
      taxSlabs = fallback.rows;
    }

    if (taxSlabs.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: `No active tax slabs found. Please add FBR tax slabs in Master Tables first.` });
    }

    const employees = (await client.query(`
      SELECT e.*,
             ss.basic_pay, ss.hra_percentage, ss.utility_percentage,
             ss.conveyance_percentage, ss.per_day_rate, ss.hourly_rate,
             ot.normal_rate, ot.holiday_rate,
             rb.rate_usd_1, rb.rate_usd_2, rb.usd_conv_rate,
             tr.daily_rate AS travel_daily_rate, tr.conv_rate AS travel_conv_rate,
             ma.absent_days, ma.late_coming_hours, ma.leave_without_pay,
             ma.overtime_normal_hours, ma.overtime_holiday_hours,
             ma.rig_bonus_days_1, ma.rig_bonus_days_2, ma.travelling_days,
             ma.advance_salary, ma.meal_allowance, ma.arrears, ma.reimbursement,
             ma.tax_adjustment, ma.annual_bonus, ma.loan_deduction,
             ma.pf_loan, ma.other_deductions
      FROM employees e
      LEFT JOIN salary_structures ss ON ss.employee_id = e.id AND ss.is_active=true
      LEFT JOIN overtime_rates    ot ON ot.employee_id = e.id AND ot.is_active=true
      LEFT JOIN rig_bonus_rates   rb ON rb.employee_id = e.id AND rb.is_active=true
      LEFT JOIN travelling_rates  tr ON tr.employee_id = e.id AND tr.is_active=true
      LEFT JOIN monthly_attendance ma ON ma.employee_id = e.id
                                      AND ma.month=$1 AND ma.year=$2
      WHERE e.is_active=true AND ss.basic_pay IS NOT NULL
    `, [month, year])).rows;

    if (employees.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'No active employees with salary structures found.' });
    }

    let processed = 0;
    const errors = [];

    for (const emp of employees) {
      try {
        const salaryStructure = {
          basic_pay: emp.basic_pay,
          hra_percentage: emp.hra_percentage,
          utility_percentage: emp.utility_percentage,
          conveyance_percentage: emp.conveyance_percentage,
          per_day_rate: emp.per_day_rate,
          hourly_rate: emp.hourly_rate
        };
        const overtimeRate = {
          normal_rate: emp.normal_rate,
          holiday_rate: emp.holiday_rate
        };
        const rigBonusRate = {
          rate_usd_1: emp.rate_usd_1,
          rate_usd_2: emp.rate_usd_2,
          usd_conv_rate: emp.usd_conv_rate
        };
        const travellingRate = {
          daily_rate: emp.travel_daily_rate,
          conv_rate: emp.travel_conv_rate
        };
        const attendance = {
          absent_days: emp.absent_days || 0,
          late_coming_hours: emp.late_coming_hours || 0,
          leave_without_pay: emp.leave_without_pay || 0,
          overtime_normal_hours: emp.overtime_normal_hours || 0,
          overtime_holiday_hours: emp.overtime_holiday_hours || 0,
          rig_bonus_days_1: emp.rig_bonus_days_1 || 0,
          rig_bonus_days_2: emp.rig_bonus_days_2 || 0,
          travelling_days: emp.travelling_days || 0,
          advance_salary: emp.advance_salary || 0,
          meal_allowance: emp.meal_allowance || 0,
          arrears: emp.arrears || 0,
          reimbursement: emp.reimbursement || 0,
          tax_adjustment: emp.tax_adjustment || 0,
          annual_bonus: emp.annual_bonus || 0,
          loan_deduction: emp.loan_deduction || 0,
          pf_loan: emp.pf_loan || 0,
          other_deductions: emp.other_deductions || 0
        };

        const grossData = await calculateGross(emp, salaryStructure, overtimeRate, rigBonusRate, travellingRate, attendance);
        const deductData = await calculateDeductions(emp, salaryStructure, attendance, grossData.gross_salary, taxSlabs);
        const netSalary = grossData.gross_salary - deductData.total_deductions;

        await client.query(`
          INSERT INTO payroll_runs
            (employee_id, month, year,
             basic_pay, house_rent_allowance, utility_allowance, conveyance_allowance,
             overtime_amount, rig_bonus_amount, travelling_amount, annual_bonus,
             arrears, reimbursement, advance_salary, meal_allowance, gross_salary,
             eobi, income_tax, provident_fund, loan_deduction, pf_loan,
             other_deductions, absent_deduction, lwp_deduction, total_deductions, net_salary,
             status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
                  $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,'draft')
          ON CONFLICT (employee_id, month, year) DO UPDATE SET
            basic_pay=$4, house_rent_allowance=$5, utility_allowance=$6, conveyance_allowance=$7,
            overtime_amount=$8, rig_bonus_amount=$9, travelling_amount=$10, annual_bonus=$11,
            arrears=$12, reimbursement=$13, advance_salary=$14, meal_allowance=$15, gross_salary=$16,
            eobi=$17, income_tax=$18, provident_fund=$19, loan_deduction=$20, pf_loan=$21,
            other_deductions=$22, absent_deduction=$23, lwp_deduction=$24, total_deductions=$25,
            net_salary=$26, status='draft', updated_at=NOW()
        `, [
          emp.id, month, year,
          grossData.basic_pay, grossData.house_rent_allowance,
          grossData.utility_allowance, grossData.conveyance_allowance,
          grossData.overtime_amount, grossData.rig_bonus_amount,
          grossData.travelling_amount, grossData.annual_bonus,
          grossData.arrears, grossData.reimbursement, grossData.advance_salary,
          grossData.meal_allowance, grossData.gross_salary,
          deductData.eobi, deductData.income_tax, deductData.provident_fund,
          deductData.loan_deduction, deductData.pf_loan, deductData.other_deductions,
          deductData.absent_deduction, deductData.lwp_deduction,
          deductData.total_deductions, netSalary
        ]);
        processed++;
      } catch (e) {
        errors.push(`${emp.employee_id} — ${emp.name}: ${e.message}`);
      }
    }

    await client.query('COMMIT');

    const totalsRow = await pool.query(
      `SELECT SUM(gross_salary) AS total_gross, SUM(total_deductions) AS total_deductions, SUM(net_salary) AS total_net
       FROM payroll_runs WHERE month=$1 AND year=$2`,
      [month, year]
    );
    const t = totalsRow.rows[0];

    res.json({
      success: true,
      message: `Payroll run complete for ${month}/${year}`,
      processed,
      total: employees.length,
      errors,
      totalGross:      Number(t.total_gross      || 0),
      totalDeductions: Number(t.total_deductions || 0),
      totalNet:        Number(t.total_net        || 0),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// POST submit for CFO approval
router.post('/submit/:month/:year', monthYearRules, validate, async (req, res) => {
  const { month, year } = req.params;
  try {
    const r = await pool.query(
      `UPDATE payroll_runs SET status='submitted', updated_at=NOW()
       WHERE month=$1 AND year=$2 AND status='draft' RETURNING id`,
      [month, year]
    );
    if (r.rowCount === 0) return res.status(400).json({ success: false, error: 'No draft payroll found. Run payroll first.' });
    res.json({ success: true, message: `${r.rowCount} records submitted for CFO approval` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST CFO approve
router.post('/approve/:month/:year', monthYearRules, validate, async (req, res) => {
  const { month, year } = req.params;
  const { remarks } = req.body;
  try {
    const r = await pool.query(
      `UPDATE payroll_runs SET status='approved', remarks=$3, updated_at=NOW()
       WHERE month=$1 AND year=$2 AND status='submitted' RETURNING id`,
      [month, year, remarks || null]
    );
    if (r.rowCount === 0) return res.status(400).json({ success: false, error: 'No submitted payroll found. Submit first.' });
    res.json({ success: true, message: `Payroll approved for ${month}/${year}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST CFO reject
router.post('/reject/:month/:year', monthYearRules, validate, async (req, res) => {
  const { month, year } = req.params;
  const { remarks } = req.body;
  try {
    const r = await pool.query(
      `UPDATE payroll_runs SET status='rejected', remarks=$3, updated_at=NOW()
       WHERE month=$1 AND year=$2 AND status='submitted' RETURNING id`,
      [month, year, remarks || null]
    );
    if (r.rowCount === 0) return res.status(400).json({ success: false, error: 'No submitted payroll found.' });
    res.json({ success: true, message: `Payroll rejected for ${month}/${year}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
