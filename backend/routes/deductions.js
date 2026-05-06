const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT md.*, e.employee_id AS emp_code, e.name AS emp_name
      FROM monthly_deductions md
      JOIN employees e ON md.employee_id = e.id
      ORDER BY md.year DESC, md.month DESC, e.employee_id
    `);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:month/:year', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT md.*, e.employee_id AS emp_code, e.name AS emp_name
      FROM monthly_deductions md
      JOIN employees e ON md.employee_id = e.id
      WHERE md.month=$1 AND md.year=$2
      ORDER BY e.employee_id
    `, [req.params.month, req.params.year]);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { employee_id, month, year, eobi, income_tax, provident_fund, loan_deduction, pf_loan, other_deductions } = req.body;
  const total = (eobi||320) + (income_tax||0) + (provident_fund||0) + (loan_deduction||0) + (pf_loan||0) + (other_deductions||0);
  try {
    const r = await pool.query(`
      INSERT INTO monthly_deductions
        (employee_id, month, year, eobi, income_tax, provident_fund, loan_deduction, pf_loan, other_deductions, total_deductions)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (employee_id, month, year) DO UPDATE SET
        eobi=$4, income_tax=$5, provident_fund=$6, loan_deduction=$7,
        pf_loan=$8, other_deductions=$9, total_deductions=$10, updated_at=NOW()
      RETURNING *
    `, [employee_id, month, year, eobi||320, income_tax||0, provident_fund||0, loan_deduction||0, pf_loan||0, other_deductions||0, total]);
    res.status(201).json({ success: true, data: r.rows[0], message: 'Deductions saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { eobi, income_tax, provident_fund, loan_deduction, pf_loan, other_deductions } = req.body;
  const total = (eobi||0) + (income_tax||0) + (provident_fund||0) + (loan_deduction||0) + (pf_loan||0) + (other_deductions||0);
  try {
    const r = await pool.query(`
      UPDATE monthly_deductions SET
        eobi=$1, income_tax=$2, provident_fund=$3, loan_deduction=$4,
        pf_loan=$5, other_deductions=$6, total_deductions=$7, updated_at=NOW()
      WHERE id=$8 RETURNING *
    `, [eobi, income_tax, provident_fund, loan_deduction, pf_loan, other_deductions, total, req.params.id]);
    res.json({ success: true, data: r.rows[0], message: 'Updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
