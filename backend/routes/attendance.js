const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT ma.*, e.employee_id AS emp_code, e.name AS emp_name,
             d.name AS department_name
      FROM monthly_attendance ma
      JOIN employees e ON ma.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY ma.year DESC, ma.month DESC, e.employee_id
    `);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:month/:year', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT ma.*, e.employee_id AS emp_code, e.name AS emp_name,
             d.name AS department_name
      FROM monthly_attendance ma
      JOIN employees e ON ma.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ma.month=$1 AND ma.year=$2
      ORDER BY e.employee_id
    `, [req.params.month, req.params.year]);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/employee/:employeeId', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM monthly_attendance WHERE employee_id=$1 ORDER BY year DESC, month DESC',
      [req.params.employeeId]
    );
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const {
    employee_id, month, year, absent_days, late_coming_hours, leave_without_pay,
    overtime_normal_hours, overtime_holiday_hours, rig_bonus_days_1, rig_bonus_days_2,
    travelling_days, advance_salary, meal_allowance, arrears, reimbursement,
    tax_adjustment, annual_bonus, loan_deduction, pf_loan, other_deductions
  } = req.body;
  try {
    const r = await pool.query(`
      INSERT INTO monthly_attendance
        (employee_id, month, year, absent_days, late_coming_hours, leave_without_pay,
         overtime_normal_hours, overtime_holiday_hours, rig_bonus_days_1, rig_bonus_days_2,
         travelling_days, advance_salary, meal_allowance, arrears, reimbursement,
         tax_adjustment, annual_bonus, loan_deduction, pf_loan, other_deductions)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      ON CONFLICT (employee_id, month, year) DO UPDATE SET
        absent_days=$4, late_coming_hours=$5, leave_without_pay=$6,
        overtime_normal_hours=$7, overtime_holiday_hours=$8,
        rig_bonus_days_1=$9, rig_bonus_days_2=$10, travelling_days=$11,
        advance_salary=$12, meal_allowance=$13, arrears=$14, reimbursement=$15,
        tax_adjustment=$16, annual_bonus=$17, loan_deduction=$18,
        pf_loan=$19, other_deductions=$20, updated_at=NOW()
      RETURNING *
    `, [
      employee_id, month, year,
      absent_days||0, late_coming_hours||0, leave_without_pay||0,
      overtime_normal_hours||0, overtime_holiday_hours||0,
      rig_bonus_days_1||0, rig_bonus_days_2||0, travelling_days||0,
      advance_salary||0, meal_allowance||0, arrears||0, reimbursement||0,
      tax_adjustment||0, annual_bonus||0, loan_deduction||0, pf_loan||0, other_deductions||0
    ]);
    res.status(201).json({ success: true, data: r.rows[0], message: 'Attendance saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const {
    absent_days, late_coming_hours, leave_without_pay,
    overtime_normal_hours, overtime_holiday_hours, rig_bonus_days_1, rig_bonus_days_2,
    travelling_days, advance_salary, meal_allowance, arrears, reimbursement,
    tax_adjustment, annual_bonus, loan_deduction, pf_loan, other_deductions
  } = req.body;
  try {
    const r = await pool.query(`
      UPDATE monthly_attendance SET
        absent_days=$1, late_coming_hours=$2, leave_without_pay=$3,
        overtime_normal_hours=$4, overtime_holiday_hours=$5,
        rig_bonus_days_1=$6, rig_bonus_days_2=$7, travelling_days=$8,
        advance_salary=$9, meal_allowance=$10, arrears=$11, reimbursement=$12,
        tax_adjustment=$13, annual_bonus=$14, loan_deduction=$15,
        pf_loan=$16, other_deductions=$17, updated_at=NOW()
      WHERE id=$18 RETURNING *
    `, [
      absent_days, late_coming_hours, leave_without_pay,
      overtime_normal_hours, overtime_holiday_hours,
      rig_bonus_days_1, rig_bonus_days_2, travelling_days,
      advance_salary, meal_allowance, arrears, reimbursement,
      tax_adjustment, annual_bonus, loan_deduction, pf_loan, other_deductions,
      req.params.id
    ]);
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: r.rows[0], message: 'Attendance updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM monthly_attendance WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
