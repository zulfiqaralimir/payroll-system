const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT ss.*, e.employee_id AS emp_code, e.name AS emp_name
      FROM salary_structures ss
      JOIN employees e ON ss.employee_id = e.id
      ORDER BY e.employee_id
    `);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/employee/:employeeId', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM salary_structures WHERE employee_id=$1',
      [req.params.employeeId]
    );
    res.json({ success: true, data: r.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { employee_id, basic_pay, hra_percentage, utility_percentage, conveyance_percentage } = req.body;
  const per_day = basic_pay / 30;
  const hourly  = per_day / 8;
  try {
    const r = await pool.query(`
      INSERT INTO salary_structures
        (employee_id, basic_pay, hra_percentage, utility_percentage,
         conveyance_percentage, per_day_rate, hourly_rate)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (employee_id) DO UPDATE SET
        basic_pay=$2, hra_percentage=$3, utility_percentage=$4,
        conveyance_percentage=$5, per_day_rate=$6, hourly_rate=$7,
        updated_at=NOW()
      RETURNING *
    `, [employee_id, basic_pay, hra_percentage || 40, utility_percentage || 5,
        conveyance_percentage || 5, per_day, hourly]);
    res.status(201).json({ success: true, data: r.rows[0], message: 'Salary structure saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { basic_pay, hra_percentage, utility_percentage, conveyance_percentage } = req.body;
  const per_day = basic_pay / 30;
  const hourly  = per_day / 8;
  try {
    const r = await pool.query(`
      UPDATE salary_structures SET
        basic_pay=$1, hra_percentage=$2, utility_percentage=$3,
        conveyance_percentage=$4, per_day_rate=$5, hourly_rate=$6, updated_at=NOW()
      WHERE id=$7 RETURNING *
    `, [basic_pay, hra_percentage, utility_percentage, conveyance_percentage,
        per_day, hourly, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: r.rows[0], message: 'Salary structure updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE salary_structures SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
