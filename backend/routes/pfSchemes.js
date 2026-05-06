const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM pf_schemes WHERE is_active=true ORDER BY scheme_type, short_name');
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM pf_schemes WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, short_name, employee_rate, employer_rate, scheme_type, trustee } = req.body;
  try {
    const r = await pool.query(`
      INSERT INTO pf_schemes (name, short_name, employee_rate, employer_rate, scheme_type, trustee)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [name, short_name, employee_rate || 0, employer_rate || 0, scheme_type, trustee]);
    res.status(201).json({ success: true, data: r.rows[0], message: 'PF scheme created' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, short_name, employee_rate, employer_rate, scheme_type, trustee } = req.body;
  try {
    const r = await pool.query(`
      UPDATE pf_schemes SET name=$1, short_name=$2, employee_rate=$3,
        employer_rate=$4, scheme_type=$5, trustee=$6
      WHERE id=$7 RETURNING *
    `, [name, short_name, employee_rate, employer_rate, scheme_type, trustee, req.params.id]);
    res.json({ success: true, data: r.rows[0], message: 'Updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE pf_schemes SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
