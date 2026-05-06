const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT ac.*, d.name AS department_name
      FROM account_codes ac
      LEFT JOIN departments d ON ac.department_id = d.id
      WHERE ac.is_active=true
      ORDER BY ac.account_code
    `);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM account_codes WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { department_id, account_code, account_name, entry_type, category } = req.body;
  try {
    const r = await pool.query(`
      INSERT INTO account_codes (department_id, account_code, account_name, entry_type, category)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [department_id, account_code, account_name, entry_type, category]);
    res.status(201).json({ success: true, data: r.rows[0], message: 'Account code created' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { department_id, account_code, account_name, entry_type, category } = req.body;
  try {
    const r = await pool.query(`
      UPDATE account_codes SET department_id=$1, account_code=$2,
        account_name=$3, entry_type=$4, category=$5
      WHERE id=$6 RETURNING *
    `, [department_id, account_code, account_name, entry_type, category, req.params.id]);
    res.json({ success: true, data: r.rows[0], message: 'Updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE account_codes SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
