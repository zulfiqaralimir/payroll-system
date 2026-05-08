import pool from '@/lib/db';
import { generatePayslipHtml } from '@/lib/payslipHtml';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export async function GET(request, { params }) {
  const { month, year } = await params;
  try {
    const r = await pool.query(`
      SELECT pr.*, e.employee_id AS employee_id_code, e.name, e.designation,
             e.bank_name, e.bank_account, e.pf_member, e.eobi_applicable,
             d.name AS department_name,
             ma.overtime_normal_hours, ma.overtime_holiday_hours,
             ma.rig_bonus_days_1, ma.rig_bonus_days_2, ma.travelling_days
      FROM payroll_runs pr
      JOIN employees e ON pr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN monthly_attendance ma
             ON ma.employee_id = e.id AND ma.month = pr.month AND ma.year = pr.year
      WHERE pr.month = $1 AND pr.year = $2
      ORDER BY e.employee_id
    `, [month, year]);

    if (!r.rows.length) {
      return new Response('No payroll data for this period', { status: 404 });
    }

    const period = `${MONTHS[Number(month) - 1]} ${year}`;

    // Build a single HTML document with all payslips — print each as a separate page
    const slipBodies = r.rows.map((row, i) => {
      const inner = generatePayslipHtml(row, false);
      // Extract everything inside <body>…</body>
      const match = inner.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const body  = match ? match[1] : inner;
      return `<div class="slip-wrapper">${body}</div>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>All Payslips — ${period}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; background: #eee; }

    .slip-wrapper {
      page-break-after: always;
      break-after: page;
    }
    .slip-wrapper:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Reuse page styles from individual payslip */
    .page {
      width: 210mm; min-height: 148mm;
      background: #fff; margin: 20px auto;
      padding: 12mm 14mm;
      box-shadow: 0 2px 12px rgba(0,0,0,.15);
    }
    .hdr { text-align:center; border-bottom:2px solid #0f1e3a; padding-bottom:8px; margin-bottom:9px; }
    .hdr-company { font-size:15px; font-weight:bold; color:#0f1e3a; }
    .hdr-addr { font-size:9.5px; color:#555; margin-top:2px; }
    .hdr-title { font-size:12px; font-weight:bold; color:#0f1e3a; margin-top:5px; letter-spacing:3px; }
    .emp-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:3px 8px; border:1px solid #bbb; border-radius:4px; padding:6px 8px; background:#f7f9fc; margin-bottom:8px; }
    .emp-field { font-size:9.5px; color:#333; }
    .emp-field b { color:#0f1e3a; }
    table { width:100%; border-collapse:collapse; }
    th { background:#0f1e3a; color:#fff; padding:5px 7px; font-size:10px; text-align:left; }
    th.r { text-align:right; }
    td { padding:3px 7px; font-size:10px; border-bottom:1px solid #ececec; color:#333; vertical-align:middle; }
    td.r { text-align:right; font-family:'Courier New',monospace; white-space:nowrap; }
    td.dim { color:#999; }
    tr.sub-total td { font-weight:bold; background:#e8edf7; color:#0f1e3a; border-top:1px solid #aab; }
    tr.net-row td { font-weight:bold; background:#0f1e3a; color:#fff; font-size:11px; }
    tr.net-row td.r { font-size:12px; }
    .note { margin-top:10px; font-size:9px; color:#888; border-top:1px dashed #ccc; padding-top:7px; text-align:center; }
    .btn-print { display:block; margin:0 auto; background:#0f1e3a; color:#fff; border:none; padding:7px 22px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold; }

    .top-bar { background:#0f1e3a; color:#fff; padding:10px 20px; text-align:center; position:sticky; top:0; z-index:99; display:flex; align-items:center; justify-content:center; gap:16px; }
    .top-bar span { font-size:13px; }

    @media print {
      body { background:#fff; }
      .page { margin:0; padding:8mm 10mm; box-shadow:none; }
      .no-print { display:none !important; }
      .top-bar { display:none !important; }
      @page { size: A5 landscape; margin:8mm; }
    }
  </style>
  <script>
    function printAll() { window.print(); }
  <\/script>
</head>
<body>
  <div class="top-bar no-print">
    <span>All Payslips — ${period} &nbsp;|&nbsp; ${r.rows.length} employees</span>
    <button class="btn-print" onclick="printAll()">&#128438; Print All / Save as PDF</button>
  </div>
  ${slipBodies}
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
