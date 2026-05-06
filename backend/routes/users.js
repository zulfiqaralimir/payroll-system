const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT id, name, email, role, is_active, last_login, created_at FROM users ORDER BY role, name');
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT id, name, email, role, is_active, last_login FROM users WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, email, role } = req.body;
  const bcrypt = require('bcryptjs');
  const tempPassword = await bcrypt.hash('Admin@123', 10);
  try {
    const r = await pool.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1,$2,$3,$4) RETURNING id, name, email, role
    `, [name, email, tempPassword, role || 'hr_manager']);
    res.status(201).json({ success: true, data: r.rows[0], message: 'User created. Temp password: Admin@123' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, email, role } = req.body;
  try {
    const r = await pool.query(`
      UPDATE users SET name=$1, email=$2, role=$3, updated_at=NOW()
      WHERE id=$4 RETURNING id, name, email, role
    `, [name, email, role, req.params.id]);
    res.json({ success: true, data: r.rows[0], message: 'User updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active=false, updated_at=NOW() WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
