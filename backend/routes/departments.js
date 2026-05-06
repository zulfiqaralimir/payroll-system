const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET all
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM departments ORDER BY staff_type, name'
    );
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET by id
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM departments WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  const { name, staff_type, description } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO departments (name, staff_type, description)
       VALUES ($1,$2,$3) RETURNING *`,
      [name, staff_type, description]
    );
    res.status(201).json({ success: true, data: r.rows[0], message: 'Department created' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  const { name, staff_type, description } = req.body;
  try {
    const r = await pool.query(
      `UPDATE departments SET name=$1, staff_type=$2, description=$3, updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [name, staff_type, description, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: r.rows[0], message: 'Department updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE soft
router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query(
      'UPDATE departments SET is_active=false, updated_at=NOW() WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, message: 'Department deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
