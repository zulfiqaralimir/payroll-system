const express  = require('express');
const router   = express.Router();
const pool     = require('../db');
const archiver = require('archiver');
const { buildPayslipHTML, renderPDF } = require('../controllers/payslipController');

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// Fetch all payroll_runs + employee/attendance data for a period
async function fetchPeriodRows(month, year) {
  const r = await pool.query(`
    SELECT
      pr.*,
      e.employee_id  AS employee_id_code,
      e.name, e.designation, e.bank_name, e.bank_account,
      e.pf_member, e.eobi_applicable,
      d.name         AS department_name,
      ma.overtime_normal_hours, ma.overtime_holiday_hours,
      ma.rig_bonus_days_1, ma.rig_bonus_days_2, ma.travelling_days
    FROM payroll_runs pr
    JOIN employees     e  ON pr.employee_id = e.id
    LEFT JOIN departments  d  ON e.department_id  = d.id
    LEFT JOIN monthly_attendance ma
           ON ma.employee_id = e.id AND ma.month = pr.month AND ma.year = pr.year
    WHERE pr.month = $1 AND pr.year = $2
    ORDER BY e.employee_id
  `, [month, year]);
  return r.rows;
}

// ── GET /api/payslips/list/:month/:year  (used by frontend table) ─────────────
router.get('/list/:month/:year', async (req, res) => {
  const { month, year } = req.params;
  try {
    const rows = await fetchPeriodRows(month, year);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/payslips/pdf/:payrollRunId  (download single PDF) ────────────────
router.get('/pdf/:payrollRunId', async (req, res) => {
  const { payrollRunId } = req.params;
  try {
    const r = await pool.query(`
      SELECT
        pr.*,
        e.employee_id  AS employee_id_code,
        e.name, e.designation, e.bank_name, e.bank_account,
        e.pf_member, e.eobi_applicable,
        d.name         AS department_name,
        ma.overtime_normal_hours, ma.overtime_holiday_hours,
        ma.rig_bonus_days_1, ma.rig_bonus_days_2, ma.travelling_days
      FROM payroll_runs pr
      JOIN employees    e  ON pr.employee_id = e.id
      LEFT JOIN departments d  ON e.department_id = d.id
      LEFT JOIN monthly_attendance ma
             ON ma.employee_id = e.id AND ma.month = pr.month AND ma.year = pr.year
      WHERE pr.id = $1
    `, [payrollRunId]);

    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Payroll record not found' });
    const row = r.rows[0];

    const html = buildPayslipHTML(row);
    const pdf  = await renderPDF(html);

    const period   = `${MONTHS[row.month - 1].slice(0,3)}-${row.year}`;
    const filename = `Payslip-${row.employee_id_code}-${period}.pdf`;

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      pdf.length,
    });
    res.end(pdf);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/payslips/zip/:month/:year  (download all as ZIP) ─────────────────
router.get('/zip/:month/:year', async (req, res) => {
  const { month, year } = req.params;
  try {
    const rows = await fetchPeriodRows(month, year);
    if (!rows.length) return res.status(404).json({ success: false, error: 'No payroll data for this period' });

    const period = `${MONTHS[month - 1].slice(0,3)}-${year}`;
    res.set({
      'Content-Type':        'application/zip',
      'Content-Disposition': `attachment; filename="WellServe-Payslips-${period}.zip"`,
    });

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);

    for (const row of rows) {
      const html = buildPayslipHTML(row);
      const pdf  = await renderPDF(html);
      const filename = `Payslip-${row.employee_id_code}-${period}.pdf`;
      archive.append(pdf, { name: filename });
    }

    await archive.finalize();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/payslips/preview/:payrollRunId  (HTML preview in browser) ────────
router.get('/preview/:payrollRunId', async (req, res) => {
  const { payrollRunId } = req.params;
  try {
    const r = await pool.query(`
      SELECT
        pr.*,
        e.employee_id  AS employee_id_code,
        e.name, e.designation, e.bank_name, e.bank_account,
        e.pf_member, e.eobi_applicable,
        d.name         AS department_name,
        ma.overtime_normal_hours, ma.overtime_holiday_hours,
        ma.rig_bonus_days_1, ma.rig_bonus_days_2, ma.travelling_days
      FROM payroll_runs pr
      JOIN employees    e  ON pr.employee_id = e.id
      LEFT JOIN departments d  ON e.department_id = d.id
      LEFT JOIN monthly_attendance ma
             ON ma.employee_id = e.id AND ma.month = pr.month AND ma.year = pr.year
      WHERE pr.id = $1
    `, [payrollRunId]);

    if (!r.rows[0]) return res.status(404).send('Not found');
    res.send(buildPayslipHTML(r.rows[0]));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
