const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT al.*, u.name AS user_name, u.role AS user_role
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.performed_at DESC
      LIMIT 500
    `);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { user_id, action, table_name, record_id, old_values, new_values, ip_address } = req.body;
  try {
    const r = await pool.query(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values, ip_address)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [user_id, action, table_name, record_id,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        ip_address]);
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
