const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM tax_slabs WHERE is_active=true ORDER BY tax_year, min_income');
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM tax_slabs WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { tax_year, min_income, max_income, tax_rate, fixed_tax, description } = req.body;
  try {
    const r = await pool.query(`
      INSERT INTO tax_slabs (tax_year, min_income, max_income, tax_rate, fixed_tax, description)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [tax_year, min_income, max_income, tax_rate || 0, fixed_tax || 0, description]);
    res.status(201).json({ success: true, data: r.rows[0], message: 'Tax slab created' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { tax_year, min_income, max_income, tax_rate, fixed_tax, description } = req.body;
  try {
    const r = await pool.query(`
      UPDATE tax_slabs SET tax_year=$1, min_income=$2, max_income=$3,
        tax_rate=$4, fixed_tax=$5, description=$6
      WHERE id=$7 RETURNING *
    `, [tax_year, min_income, max_income, tax_rate, fixed_tax, description, req.params.id]);
    res.json({ success: true, data: r.rows[0], message: 'Updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE tax_slabs SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
