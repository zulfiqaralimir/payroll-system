const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT rb.*, e.employee_id AS emp_code, e.name AS emp_name
      FROM rig_bonus_rates rb
      JOIN employees e ON rb.employee_id = e.id
      ORDER BY e.employee_id
    `);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/employee/:employeeId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM rig_bonus_rates WHERE employee_id=$1', [req.params.employeeId]);
    res.json({ success: true, data: r.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { employee_id, rate_usd_1, rate_usd_2, usd_conv_rate } = req.body;
  try {
    const r = await pool.query(`
      INSERT INTO rig_bonus_rates (employee_id, rate_usd_1, rate_usd_2, usd_conv_rate)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (employee_id) DO UPDATE SET
        rate_usd_1=$2, rate_usd_2=$3, usd_conv_rate=$4, updated_at=NOW()
      RETURNING *
    `, [employee_id, rate_usd_1 || 0, rate_usd_2 || 0, usd_conv_rate || 278]);
    res.status(201).json({ success: true, data: r.rows[0], message: 'Rig bonus rates saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { rate_usd_1, rate_usd_2, usd_conv_rate } = req.body;
  try {
    const r = await pool.query(`
      UPDATE rig_bonus_rates SET rate_usd_1=$1, rate_usd_2=$2, usd_conv_rate=$3, updated_at=NOW()
      WHERE id=$4 RETURNING *
    `, [rate_usd_1, rate_usd_2, usd_conv_rate, req.params.id]);
    res.json({ success: true, data: r.rows[0], message: 'Updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE rig_bonus_rates SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
