const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmt(n) {
  return Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function generatePayslipHtml(row, autoPrint = false) {
  const period   = `${MONTHS[row.month - 1].slice(0, 3)}-${String(row.year).slice(-2)}`;
  const otHours  = Number(row.overtime_normal_hours  || 0) + Number(row.overtime_holiday_hours || 0);
  const rigDays  = Number(row.rig_bonus_days_1       || 0) + Number(row.rig_bonus_days_2       || 0);
  const travDays = Number(row.travelling_days        || 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Salary Slip — ${row.name} — ${period}</title>
  <style>
    *  { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; background: #f0f0f0; }
    .page {
      width: 210mm; min-height: 148mm;
      background: #fff;
      margin: 20px auto;
      padding: 12mm 14mm;
      box-shadow: 0 2px 12px rgba(0,0,0,.15);
    }

    /* Header */
    .hdr            { text-align:center; border-bottom: 2px solid #0f1e3a; padding-bottom: 8px; margin-bottom: 9px; }
    .hdr-company    { font-size: 15px; font-weight: bold; color: #0f1e3a; letter-spacing: .5px; }
    .hdr-addr       { font-size: 9.5px; color: #555; margin-top: 2px; }
    .hdr-title      { font-size: 12px; font-weight: bold; color: #0f1e3a; margin-top: 5px; letter-spacing: 3px; }

    /* Employee info row */
    .emp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 3px 8px;
      border: 1px solid #bbb;
      border-radius: 4px;
      padding: 6px 8px;
      background: #f7f9fc;
      margin-bottom: 8px;
    }
    .emp-field      { font-size: 9.5px; color: #333; }
    .emp-field b    { color: #0f1e3a; }

    /* Salary table */
    table           { width:100%; border-collapse: collapse; }
    th              { background: #0f1e3a; color: #fff; padding: 5px 7px; font-size: 10px; text-align: left; }
    th.r            { text-align: right; }
    td              { padding: 3px 7px; font-size: 10px; border-bottom: 1px solid #ececec; color: #333; vertical-align: middle; }
    td.r            { text-align: right; font-family: 'Courier New', monospace; white-space: nowrap; }
    td.dim          { color: #999; }
    tr.sub-total td { font-weight: bold; background: #e8edf7; color: #0f1e3a; border-top: 1px solid #aab; }
    tr.net-row  td  { font-weight: bold; background: #0f1e3a; color: #fff; font-size: 11px; }
    tr.net-row td.r { font-size: 12px; }

    /* Note */
    .note { margin-top: 10px; font-size: 9px; color: #888; border-top: 1px dashed #ccc; padding-top: 7px; text-align: center; }

    /* Print button (hidden on print) */
    .btn-print {
      display: block; margin: 14px auto 0;
      background: #0f1e3a; color: #fff; border: none;
      padding: 7px 22px; border-radius: 4px; cursor: pointer;
      font-size: 12px; font-weight: bold;
    }
    .btn-print:hover { background: #1a2f5a; }

    @media print {
      body  { background: #fff; }
      .page { margin: 0; padding: 8mm 10mm; box-shadow: none; }
      .no-print { display: none !important; }
      @page { size: A5 landscape; margin: 8mm; }
    }
  </style>
</head>
<body>
  ${autoPrint ? "<script>window.addEventListener('load', () => setTimeout(() => window.print(), 600));<\/script>" : ''}
  <div class="page">

    <div class="hdr">
      <div class="hdr-company">WellServe Oilfield Services (Pvt) Ltd.</div>
      <div class="hdr-addr">Plot 5-J &amp; 5-K, Street 1, I-10/3, Islamabad</div>
      <div class="hdr-title">SALARY SLIP</div>
    </div>

    <div class="emp-grid">
      <div class="emp-field">Employee Name: <b>${row.name}</b></div>
      <div class="emp-field">Employee ID: <b>${row.employee_id_code}</b></div>
      <div class="emp-field">Period: <b>${period}</b></div>
      <div class="emp-field">Job Title: <b>${row.designation || '—'}</b></div>
      <div class="emp-field">Department: <b>${row.department_name || '—'}</b></div>
      <div class="emp-field">Bank: <b>${row.bank_name || '—'}</b></div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:38%">Salary Component</th>
          <th class="r" style="width:13%">PKR</th>
          <th style="width:36%">Deductions</th>
          <th class="r" style="width:13%">PKR</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Basic Pay</td>
          <td class="r">${fmt(row.basic_pay)}</td>
          <td>Absent Days</td>
          <td class="r">${fmt(row.absent_deduction)}</td>
        </tr>
        <tr>
          <td>House Rent Allowance</td>
          <td class="r">${fmt(row.house_rent_allowance)}</td>
          <td>Leave without Pay</td>
          <td class="r">${fmt(row.leave_without_pay)}</td>
        </tr>
        <tr>
          <td>Utility Allowance</td>
          <td class="r">${fmt(row.utility_allowance)}</td>
          <td>EOBI</td>
          <td class="r">${fmt(row.eobi)}</td>
        </tr>
        <tr>
          <td>Conveyance Allowance</td>
          <td class="r">${fmt(row.conveyance_allowance)}</td>
          <td>Income Tax</td>
          <td class="r">${fmt(row.income_tax)}</td>
        </tr>
        <tr>
          <td>Over Time${otHours > 0 ? ` (${otHours} Hrs)` : ''}</td>
          <td class="r ${Number(row.overtime_amount || 0) === 0 ? 'dim' : ''}">${fmt(row.overtime_amount)}</td>
          <td>Provident Fund</td>
          <td class="r">${fmt(row.provident_fund)}</td>
        </tr>
        <tr>
          <td>Rig Bonus${rigDays > 0 ? ` (${rigDays} Days)` : ''}</td>
          <td class="r ${Number(row.rig_bonus_amount || 0) === 0 ? 'dim' : ''}">${fmt(row.rig_bonus_amount)}</td>
          <td>Other Deductions</td>
          <td class="r">${fmt(row.other_deductions)}</td>
        </tr>
        <tr>
          <td>Travelling Allow.${travDays > 0 ? ` (${travDays} Days)` : ''}</td>
          <td class="r ${Number(row.travelling_amount || 0) === 0 ? 'dim' : ''}">${fmt(row.travelling_amount)}</td>
          <td>Loan Deductions</td>
          <td class="r">${fmt(row.loan_deduction)}</td>
        </tr>
        <tr>
          <td>Arrears</td>
          <td class="r ${Number(row.arrears || 0) === 0 ? 'dim' : ''}">${fmt(row.arrears)}</td>
          <td>PF Loan Deduction</td>
          <td class="r">${fmt(row.pf_loan_deduction)}</td>
        </tr>
        <tr>
          <td>Annual Bonus</td>
          <td class="r ${Number(row.annual_bonus || 0) === 0 ? 'dim' : ''}">${fmt(row.annual_bonus)}</td>
          <td></td><td></td>
        </tr>
        <tr>
          <td>Reimbursement / Adj.</td>
          <td class="r ${Number(row.reimbursement || 0) === 0 ? 'dim' : ''}">${fmt(row.reimbursement)}</td>
          <td></td><td></td>
        </tr>
        <tr class="sub-total">
          <td>TOTAL</td>
          <td class="r">${fmt(row.gross_salary)}</td>
          <td>TOTAL</td>
          <td class="r">${fmt(row.total_deductions)}</td>
        </tr>
        <tr class="net-row">
          <td colspan="2">A/C: ${row.bank_account || '—'} &nbsp;|&nbsp; ${row.bank_name || '—'}</td>
          <td>NET SALARY (PKR)</td>
          <td class="r">${fmt(row.net_salary)}</td>
        </tr>
      </tbody>
    </table>

    <div class="note">
      NOTE: This is a computer generated document. It does not require any signatures.
    </div>

    ${!autoPrint ? `<button class="btn-print no-print" onclick="window.print()">&#128438; Print / Save as PDF</button>` : ''}

  </div>
</body>
</html>`;
}
