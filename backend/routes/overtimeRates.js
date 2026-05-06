const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT ot.*, e.employee_id AS emp_code, e.name AS emp_name
      FROM overtime_rates ot
      JOIN employees e ON ot.employee_id = e.id
      ORDER BY e.employee_id
    `);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/employee/:employeeId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM overtime_rates WHERE employee_id=$1', [req.params.employeeId]);
    res.json({ success: true, data: r.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { employee_id, normal_rate, holiday_rate } = req.body;
  try {
    const r = await pool.query(`
      INSERT INTO overtime_rates (employee_id, normal_rate, holiday_rate)
      VALUES ($1,$2,$3)
      ON CONFLICT (employee_id) DO UPDATE SET
        normal_rate=$2, holiday_rate=$3, updated_at=NOW()
      RETURNING *
    `, [employee_id, normal_rate, holiday_rate]);
    res.status(201).json({ success: true, data: r.rows[0], message: 'OT rates saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { normal_rate, holiday_rate } = req.body;
  try {
    const r = await pool.query(`
      UPDATE overtime_rates SET normal_rate=$1, holiday_rate=$2, updated_at=NOW()
      WHERE id=$3 RETURNING *
    `, [normal_rate, holiday_rate, req.params.id]);
    res.json({ success: true, data: r.rows[0], message: 'Updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE overtime_rates SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
