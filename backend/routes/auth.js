const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND is_active=true', [email]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const user  = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await pool.query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);

    await pool.query(`
      INSERT INTO audit_log (user_id, action, table_name, ip_address)
      VALUES ($1,'LOGIN','users',$2)
    `, [user.id, req.ip]);

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !oldPassword || !newPassword)
    return res.status(400).json({ success: false, error: 'userId, oldPassword and newPassword are required' });
  if (newPassword.length < 8)
    return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'User not found' });

    const user  = result.rows[0];
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid)
      return res.status(401).json({ success: false, error: 'Wrong password' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2', [hash, userId]);

    await pool.query(`
      INSERT INTO audit_log (user_id, action, table_name, ip_address)
      VALUES ($1,'CHANGE_PASSWORD','users',$2)
    `, [userId, req.ip]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/logout (audit trail)
router.post('/logout', async (req, res) => {
  const { userId } = req.body;
  try {
    if (userId) {
      await pool.query(`
        INSERT INTO audit_log (user_id, action, table_name, ip_address)
        VALUES ($1,'LOGOUT','users',$2)
      `, [userId, req.ip]);
    }
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    res.json({ success: true, message: 'Logged out' });
  }
});

// GET /api/auth/me — verify token and return current user
router.get('/me', async (req, res) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ success: false, error: 'No token' });
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const r = await pool.query('SELECT id, name, email, role FROM users WHERE id=$1 AND is_active=true', [decoded.id]);
    if (!r.rows[0]) return res.status(401).json({ success: false, error: 'User not found' });
    res.json({ success: true, user: r.rows[0] });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

module.exports = router;
