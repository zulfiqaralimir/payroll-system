const puppeteer = require('puppeteer');

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const pkr = n => Number(n || 0).toLocaleString('en-PK', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function buildPayslipHTML(row) {
  const period   = `${MONTHS[row.month - 1].slice(0, 3)}-${String(row.year).slice(2)}`;
  const bankAcct = (row.bank_account || '').length > 14
    ? row.bank_account.slice(0, 14) + '...'
    : (row.bank_account || 'N/A');
  const bankShort = (row.bank_account || '').length > 10
    ? row.bank_account.slice(0, 10) + '...'
    : (row.bank_account || 'N/A');

  const otHours    = Number(row.overtime_normal_hours  || 0) + Number(row.overtime_holiday_hours || 0);
  const rigDays    = Number(row.rig_bonus_days_1 || 0) + Number(row.rig_bonus_days_2 || 0);
  const travelDays = Number(row.travelling_days || 0);

  const earningRows = [
    ['Basic Pay',                           row.basic_pay],
    ['House Rent Allow.',                   row.house_rent_allowance],
    ['Utility Allowance',                   row.utility_allowance],
    ['Conveyance Allow.',                   row.conveyance_allowance],
    [`Over Time (${otHours} Hrs)`,          row.overtime_amount],
    [`Rig Bonus (${rigDays} Days)`,         row.rig_bonus_amount],
    [`Travelling Allow. (${travelDays} Days)`, row.travelling_amount],
    ['Arrears',                             row.arrears],
    ['Annual Bonus',                        row.annual_bonus],
    ['Reimbursement/Adj.',                  row.reimbursement],
    ['Advance Against Salary',              row.advance_salary],
    ['Meal Allowance',                      row.meal_allowance],
  ];

  const deductRows = [
    ['Absent Days',        row.absent_deduction],
    ['Leave without Pay',  row.lwp_deduction],
    ['EOBI',               row.eobi],
    ['Income Tax',         row.income_tax],
    ['Provident Fund',     row.provident_fund],
    ['Other Deductions',   row.other_deductions],
    ['Loan Deductions',    row.loan_deduction],
    ['PF Loan Deduction',  row.pf_loan],
  ];

  const row2td = ([label, val], i) => `
    <tr class="${i % 2 === 1 ? 'alt' : ''}">
      <td class="lbl">${label}</td>
      <td class="amt">${pkr(val)}</td>
    </tr>`;

  // Pad deduction rows so columns align visually (same row count as earnings)
  const padded = [...deductRows];
  while (padded.length < earningRows.length) padded.push(['', '']);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #111; background: #fff; }
.page { width: 210mm; padding: 10mm 12mm 8mm; }

/* ── Header ────────────────────────────────────── */
.hdr { text-align:center; padding-bottom:7px; border-bottom:3px solid #0f1e3a; }
.co-name { font-size:15pt; font-weight:bold; color:#0f1e3a; letter-spacing:.3px; }
.co-addr { font-size:9pt; color:#555; margin-top:2px; }
.slip-title {
  display:inline-block; margin-top:7px;
  font-size:11pt; font-weight:bold; color:#0f1e3a;
  letter-spacing:3px; border:2px solid #0f1e3a;
  padding:2px 18px; border-radius:2px;
}

/* ── Employee info band ─────────────────────────── */
.emp-band {
  margin: 8px 0 6px;
  background:#f0f4f8; border-radius:3px;
  padding: 5px 10px; display:grid;
  grid-template-columns:1fr 1fr 1fr;
  gap:4px 10px; font-size:9.5pt;
}
.emp-band .fi { display:flex; gap:5px; }
.emp-band .k  { color:#666; white-space:nowrap; }
.emp-band .v  { font-weight:bold; color:#111; }

/* ── Two-column salary table ───────────────────── */
.cols { display:grid; grid-template-columns:1fr 1fr; gap:0 12px; margin-top:4px; }

.col-hdr {
  background:#0f1e3a; color:#fff; font-weight:bold;
  font-size:9pt; letter-spacing:1.5px; text-align:center;
  padding:4px 6px; border-radius:2px 2px 0 0;
}

table { width:100%; border-collapse:collapse; }
table td { padding:2.8px 7px; border-bottom:1px solid #eee; }
table td.lbl { color:#222; }
table td.amt { text-align:right; font-family:'Courier New',monospace; width:72px; font-weight:500; }
table tr.alt  { background:#f7f9fc; }

.col-foot {
  display:flex; justify-content:space-between; align-items:center;
  background:#dde3ec; border-top:1.5px solid #0f1e3a;
  padding:4px 7px; font-weight:bold; font-size:10pt;
}
.col-foot .f-amt { font-family:'Courier New',monospace; }

.deduct-bank {
  font-size:8.5pt; color:#555; padding:3px 7px;
  background:#f7f7f7; border-bottom:1px solid #eee;
  border-top:none;
}

/* ── NET SALARY ─────────────────────────────────── */
.net-box {
  margin-top:10px; background:#0f1e3a; color:#fff; border-radius:4px;
  display:flex; justify-content:space-between; align-items:center;
  padding:8px 16px;
}
.net-box .net-lbl { font-size:13pt; font-weight:bold; letter-spacing:2px; }
.net-box .net-amt { font-size:16pt; font-weight:bold; font-family:'Courier New',monospace; }

/* ── Note ───────────────────────────────────────── */
.note {
  margin-top:10px; font-size:8.5pt; color:#666;
  text-align:center; padding:5px 10px;
  border:1px dashed #ccc; border-radius:3px; background:#fffdf0;
}
</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="co-name">Wellserve Oilfield Services (Pvt) Ltd.</div>
    <div class="co-addr">Plot 5-J &amp; 5-K, Street 1, I-10/3, Islamabad</div>
    <div class="slip-title">SALARY SLIP</div>
  </div>

  <div class="emp-band">
    <div class="fi"><span class="k">Employee Name:</span><span class="v">${row.name}</span></div>
    <div class="fi"><span class="k">Employee ID:</span><span class="v">${row.employee_id_code}</span></div>
    <div class="fi"><span class="k">Period:</span><span class="v">${period}</span></div>
    <div class="fi"><span class="k">Job Title:</span><span class="v">${row.designation || '—'}</span></div>
    <div class="fi"><span class="k">Department:</span><span class="v">${row.department_name || '—'}</span></div>
    <div class="fi"><span class="k">Bank Account:</span><span class="v">${bankAcct}</span></div>
  </div>

  <div class="cols">
    <div>
      <div class="col-hdr">SALARY &amp; EARNINGS</div>
      <table>
        ${earningRows.map(row2td).join('')}
      </table>
      <div class="col-foot">
        <span>TOTAL</span>
        <span class="f-amt">${pkr(row.gross_salary)}</span>
      </div>
    </div>

    <div>
      <div class="col-hdr">DEDUCTIONS</div>
      <table>
        ${padded.map(row2td).join('')}
      </table>
      <div class="col-foot">
        <span>TOTAL</span>
        <span class="f-amt">${pkr(row.total_deductions)}</span>
      </div>
      <div class="deduct-bank">
        Bank: ${row.bank_name || '—'} &nbsp;|&nbsp; A/C: ${bankShort}
      </div>
    </div>
  </div>

  <div class="net-box">
    <span class="net-lbl">NET SALARY</span>
    <span class="net-amt">PKR ${pkr(row.net_salary)}</span>
  </div>

  <div class="note">
    NOTE: This is a computer generated document. It does not require any signatures.
  </div>

</div>
</body>
</html>`;
}

async function renderPDF(html) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
  } finally {
    await browser.close();
  }
}

module.exports = { buildPayslipHTML, renderPDF };
