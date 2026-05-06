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

// GET status for a month
router.get('/:month/:year', monthYearRules, validate, async (req, res) => {
  try {
    const { month, year } = req.params;
    const r = await pool.query(`
      SELECT status, COUNT(*) AS employees,
             SUM(gross_salary) AS total_gross, SUM(net_salary) AS total_net
      FROM payroll_runs
      WHERE month=$1 AND year=$2
      GROUP BY status
    `, [month, year]);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST submit draft → submitted (HR Manager action)
router.post('/submit/:month/:year', monthYearRules, validate, async (req, res) => {
  const { month, year } = req.params;
  const { submitted_by } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `UPDATE payroll_runs SET status='submitted', updated_at=NOW()
       WHERE month=$1 AND year=$2 AND status='draft'
       RETURNING id`,
      [month, year]
    );
    if (r.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'No draft payroll found for this period. Run payroll first.' });
    }
    await client.query(`
      INSERT INTO audit_log (user_id, action, table_name, new_values, ip_address)
      VALUES ($1,'SUBMIT','payroll_runs',$2,$3)
    `, [submitted_by || null, JSON.stringify({ month, year, rows: r.rowCount }), req.ip]);
    await client.query('COMMIT');
    res.json({ success: true, message: `${r.rowCount} payroll records submitted for CFO approval` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// POST approve submitted → approved (CFO action)
router.post('/approve/:month/:year', monthYearRules, validate, async (req, res) => {
  const { month, year } = req.params;
  const { approved_by, remarks } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `UPDATE payroll_runs SET status='approved', approved_by=$3, remarks=$4, updated_at=NOW()
       WHERE month=$1 AND year=$2 AND status='submitted'
       RETURNING id`,
      [month, year, approved_by || null, remarks || null]
    );
    if (r.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'No submitted payroll found. Submit first.' });
    }
    await client.query(`
      INSERT INTO audit_log (user_id, action, table_name, new_values, ip_address)
      VALUES ($1,'APPROVE','payroll_runs',$2,$3)
    `, [approved_by || null, JSON.stringify({ month, year, rows: r.rowCount, remarks }), req.ip]);
    await client.query('COMMIT');
    res.json({ success: true, message: `Payroll approved for ${month}/${year} (${r.rowCount} records)` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// POST reject submitted → rejected (CFO action)
router.post('/reject/:month/:year', monthYearRules, validate, async (req, res) => {
  const { month, year } = req.params;
  const { rejected_by, remarks } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `UPDATE payroll_runs SET status='rejected', remarks=$3, updated_at=NOW()
       WHERE month=$1 AND year=$2 AND status='submitted'
       RETURNING id`,
      [month, year, remarks || null]
    );
    if (r.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'No submitted payroll found for this period.' });
    }
    await client.query(`
      INSERT INTO audit_log (user_id, action, table_name, new_values, ip_address)
      VALUES ($1,'REJECT','payroll_runs',$2,$3)
    `, [rejected_by || null, JSON.stringify({ month, year, rows: r.rowCount, remarks }), req.ip]);
    await client.query('COMMIT');
    res.json({ success: true, message: `Payroll rejected for ${month}/${year}. Returned to draft for correction.` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// POST mark as paid (after bank transfer)
router.post('/mark-paid/:month/:year', monthYearRules, validate, async (req, res) => {
  const { month, year } = req.params;
  const { paid_by } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `UPDATE payroll_runs SET status='paid', updated_at=NOW()
       WHERE month=$1 AND year=$2 AND status='approved'
       RETURNING id`,
      [month, year]
    );
    if (r.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'No approved payroll found for this period.' });
    }
    await client.query(`
      INSERT INTO audit_log (user_id, action, table_name, new_values, ip_address)
      VALUES ($1,'MARK_PAID','payroll_runs',$2,$3)
    `, [paid_by || null, JSON.stringify({ month, year, rows: r.rowCount }), req.ip]);
    await client.query('COMMIT');
    res.json({ success: true, message: `${r.rowCount} payroll records marked as paid` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
