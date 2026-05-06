const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT pe.*, e.employee_id AS emp_code, e.name AS emp_name,
             ps.name AS scheme_name, ps.short_name AS scheme_code
      FROM pf_eobi_report pe
      JOIN employees e ON pe.employee_id = e.id
      LEFT JOIN pf_schemes ps ON pe.pf_scheme_id = ps.id
      ORDER BY pe.year DESC, pe.month DESC, e.employee_id
    `);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:month/:year', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT pe.*, e.employee_id AS emp_code, e.name AS emp_name,
             ps.name AS scheme_name, ps.short_name AS scheme_code
      FROM pf_eobi_report pe
      JOIN employees e ON pe.employee_id = e.id
      LEFT JOIN pf_schemes ps ON pe.pf_scheme_id = ps.id
      WHERE pe.month=$1 AND pe.year=$2
      ORDER BY e.employee_id
    `, [req.params.month, req.params.year]);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/generate/:month/:year', async (req, res) => {
  const { month, year } = req.params;
  try {
    const payroll = await pool.query(`
      SELECT pr.*, e.pf_member, e.eobi_applicable, pr.provident_fund,
             pr.pf_loan, pr.loan_deduction
      FROM payroll_runs pr
      JOIN employees e ON pr.employee_id = e.id
      WHERE pr.month=$1 AND pr.year=$2
    `, [month, year]);

    let created = 0;
    for (const row of payroll.rows) {
      const empShare = parseFloat(row.provident_fund) || 0;
      const empShare2 = empShare;
      await pool.query(`
        INSERT INTO pf_eobi_report
          (employee_id, month, year, pf_employee_share, pf_employer_share, pf_loan_deduction, pf_total,
           eobi_employee_share, eobi_employer_share, eobi_total)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (employee_id, month, year) DO UPDATE SET
          pf_employee_share=$4, pf_employer_share=$5, pf_loan_deduction=$6, pf_total=$7,
          eobi_employee_share=$8, eobi_employer_share=$9, eobi_total=$10
      `, [
        row.employee_id, month, year,
        empShare, empShare2, parseFloat(row.pf_loan)||0, empShare + empShare2,
        row.eobi_applicable ? 320 : 0,
        row.eobi_applicable ? 1600 : 0,
        row.eobi_applicable ? 1920 : 0
      ]);
      created++;
    }
    res.json({ success: true, message: `${created} PF/EOBI records generated` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
