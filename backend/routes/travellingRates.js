const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT tr.*, e.employee_id AS emp_code, e.name AS emp_name
      FROM travelling_rates tr
      JOIN employees e ON tr.employee_id = e.id
      ORDER BY e.employee_id
    `);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/employee/:employeeId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM travelling_rates WHERE employee_id=$1', [req.params.employeeId]);
    res.json({ success: true, data: r.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { employee_id, daily_rate, conv_rate } = req.body;
  try {
    const r = await pool.query(`
      INSERT INTO travelling_rates (employee_id, daily_rate, conv_rate)
      VALUES ($1,$2,$3)
      ON CONFLICT (employee_id) DO UPDATE SET
        daily_rate=$2, conv_rate=$3, updated_at=NOW()
      RETURNING *
    `, [employee_id, daily_rate || 1500, conv_rate || 1]);
    res.status(201).json({ success: true, data: r.rows[0], message: 'Travelling rates saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { daily_rate, conv_rate } = req.body;
  try {
    const r = await pool.query(`
      UPDATE travelling_rates SET daily_rate=$1, conv_rate=$2, updated_at=NOW()
      WHERE id=$3 RETURNING *
    `, [daily_rate, conv_rate, req.params.id]);
    res.json({ success: true, data: r.rows[0], message: 'Updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE travelling_rates SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
