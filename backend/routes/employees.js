const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });
  next();
};

const createRules = [
  body('employee_id').notEmpty().withMessage('Employee ID is required'),
  body('name').notEmpty().withMessage('Employee name is required'),
  body('designation').notEmpty().withMessage('Designation is required'),
  body('department_id').isInt({ min: 1 }).withMessage('Valid department is required'),
  body('cnic').optional().matches(/^\d{5}-\d{7}-\d{1}$/).withMessage('CNIC format: 00000-0000000-0'),
  body('employment_type').optional().isIn(['permanent', 'contract', 'daily_wages']).withMessage('Invalid employment type'),
  body('mode_of_payment').optional().isIn(['bank', 'cash', 'cheque']).withMessage('Invalid payment mode'),
];

// GET all active employees with dept name
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT e.*, d.name AS department_name, d.staff_type,
             b.short_name AS bank_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN banks b ON b.short_name = e.bank_name OR b.name = e.bank_name
      WHERE e.is_active = true
      ORDER BY e.employee_id
    `);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all employees including inactive (for admin view)
router.get('/all', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT e.*, d.name AS department_name, d.staff_type
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.is_active DESC, e.employee_id
    `);
    res.json({ success: true, data: r.rows, count: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET by id
router.get('/:id', param('id').isInt().withMessage('Invalid employee ID'), validate, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT e.*, d.name AS department_name, d.staff_type
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id=$1
    `, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Employee not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create
router.post('/', createRules, validate, async (req, res) => {
  const {
    employee_id, name, designation, department_id, cnic,
    father_name, mother_name, date_of_joining, employment_type,
    bank_name, bank_account, mode_of_payment, pf_member, eobi_applicable
  } = req.body;
  try {
    // Check duplicate employee_id
    const exists = await pool.query('SELECT id FROM employees WHERE employee_id=$1', [employee_id]);
    if (exists.rows[0]) return res.status(409).json({ success: false, error: `Employee ID ${employee_id} already exists` });

    const r = await pool.query(`
      INSERT INTO employees
        (employee_id, name, designation, department_id, cnic,
         father_name, mother_name, date_of_joining, employment_type,
         bank_name, bank_account, mode_of_payment, pf_member, eobi_applicable)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *
    `, [
      employee_id, name, designation, department_id, cnic || null,
      father_name || null, mother_name || null, date_of_joining || null,
      employment_type || 'permanent',
      bank_name || null, bank_account || null, mode_of_payment || 'bank',
      pf_member || false, eobi_applicable !== false
    ]);
    res.status(201).json({ success: true, data: r.rows[0], message: 'Employee created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update
router.put('/:id', [
  param('id').isInt().withMessage('Invalid employee ID'),
  ...createRules
], validate, async (req, res) => {
  const {
    employee_id, name, designation, department_id, cnic,
    father_name, mother_name, date_of_joining, employment_type,
    bank_name, bank_account, mode_of_payment, pf_member, eobi_applicable
  } = req.body;
  try {
    const r = await pool.query(`
      UPDATE employees SET
        employee_id=$1, name=$2, designation=$3, department_id=$4, cnic=$5,
        father_name=$6, mother_name=$7, date_of_joining=$8, employment_type=$9,
        bank_name=$10, bank_account=$11, mode_of_payment=$12,
        pf_member=$13, eobi_applicable=$14, updated_at=NOW()
      WHERE id=$15 RETURNING *
    `, [
      employee_id, name, designation, department_id, cnic || null,
      father_name || null, mother_name || null, date_of_joining || null, employment_type,
      bank_name || null, bank_account || null, mode_of_payment,
      pf_member, eobi_applicable, req.params.id
    ]);
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Employee not found' });
    res.json({ success: true, data: r.rows[0], message: 'Employee updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE soft delete
router.delete('/:id', param('id').isInt().withMessage('Invalid employee ID'), validate, async (req, res) => {
  try {
    const r = await pool.query(
      'UPDATE employees SET is_active=false, updated_at=NOW() WHERE id=$1 RETURNING id, employee_id, name',
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Employee not found' });
    res.json({ success: true, message: `Employee ${r.rows[0].employee_id} — ${r.rows[0].name} deactivated` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
