const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT bt.*, e.employee_id AS emp_code, e.name AS emp_name,
             b.name AS bank_name, b.short_name AS bank_short
      FROM bank_transfers bt
      JOIN employees e ON bt.employee_id = e.id
      LEFT JOIN banks b ON bt.bank_id = b.id
      ORDER BY bt.year DESC, bt.month DESC
    `);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:month/:year', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT bt.*, e.employee_id AS emp_code, e.name AS emp_name,
             e.bank_account, b.name AS bank_name, b.short_name AS bank_short
      FROM bank_transfers bt
      JOIN employees e ON bt.employee_id = e.id
      LEFT JOIN banks b ON bt.bank_id = b.id
      WHERE bt.month=$1 AND bt.year=$2
      ORDER BY b.short_name, e.employee_id
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
      SELECT pr.*, e.bank_name, e.bank_account, e.mode_of_payment
      FROM payroll_runs pr
      JOIN employees e ON pr.employee_id = e.id
      WHERE pr.month=$1 AND pr.year=$2 AND pr.status='approved'
    `, [month, year]);

    let created = 0;
    for (const row of payroll.rows) {
      const bank = await pool.query('SELECT id FROM banks WHERE name=$1 OR short_name=$1', [row.bank_name]);
      const bankId = bank.rows[0]?.id || null;
      await pool.query(`
        INSERT INTO bank_transfers (payroll_id, employee_id, bank_id, account_no, amount, month, year, transfer_mode)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT DO NOTHING
      `, [row.id, row.employee_id, bankId, row.bank_account, row.net_salary, month, year, row.mode_of_payment || 'bank']);
      created++;
    }
    res.json({ success: true, message: `${created} bank transfers generated` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
