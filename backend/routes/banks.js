const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM banks WHERE is_active=true ORDER BY short_name');
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM banks WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, short_name, account_no, branch } = req.body;
  try {
    const r = await pool.query(`
      INSERT INTO banks (name, short_name, account_no, branch)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [name, short_name, account_no, branch]);
    res.status(201).json({ success: true, data: r.rows[0], message: 'Bank created' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, short_name, account_no, branch } = req.body;
  try {
    const r = await pool.query(`
      UPDATE banks SET name=$1, short_name=$2, account_no=$3, branch=$4
      WHERE id=$5 RETURNING *
    `, [name, short_name, account_no, branch, req.params.id]);
    res.json({ success: true, data: r.rows[0], message: 'Updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE banks SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
