# Phase 04 — Authentication + Roles
> WellServe HR Payroll System
> Only start after Phase 03 is complete and confirmed.

---

## GOAL
Build secure login system with JWT and role-based access control.

---

## Install packages
```bash
npm install bcryptjs jsonwebtoken
```

---

## Create backend/routes/auth.js

```javascript
const express   = require('express');
const router    = express.Router();
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const pool      = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND is_active=true', [email]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await pool.query(
      'UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name,
              email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id=$1', [userId]
    );
    const user  = result.rows[0];
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid)
      return res.status(401).json({ success: false, error: 'Wrong password' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2',
      [hash, userId]
    );
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
```

---

## Create backend/middleware/auth.js

```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token)
    return res.status(401).json({ success: false, error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};
```

---

## Create backend/middleware/roleCheck.js

```javascript
module.exports = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role))
    return res.status(403).json({ success: false, error: 'Access denied' });
  next();
};
```

---

## Add to .env

```env
JWT_SECRET=wellserve_payroll_secret_key_2024
```

---

## Frontend Login Page

Build src/pages/Login.jsx with:
- WellServe logo / company name at top
- Email input
- Password input
- Login button
- Show error message if invalid
- On success → redirect to dashboard
- Store JWT token in memory (not localStorage)
- Role-based menu:
  - admin → sees everything
  - hr_manager → sees employee, payroll, payslips
  - cfo → sees approvals and reports only

---

## VERIFICATION CHECKLIST

- [ ] Login works with admin@wellserve.com
- [ ] Wrong password shows error
- [ ] JWT token generated correctly
- [ ] Role-based menu shows correct items
- [ ] Protected routes reject unauthenticated requests
- [ ] localhost:3000/login shows login page

---

## NEXT STEP

Report back with confirmation.
Permission will be given for:
**phases/05-excel-watcher.md**

DO NOT proceed without permission.
