# Phase 05 — Excel Folder Watcher + Import
> WellServe HR Payroll System
> Only start after Phase 04 is complete and confirmed.

---

## GOAL
Watch a local folder for WellServe-HR-Data.xlsx.
When file is added or changed → notify HR → import all sheets into database.

---

## Install packages
```bash
npm install chokidar xlsx
```

---

## Excel File Structure Expected

```
WellServe-HR-Data.xlsx
├── Sheet 1: Employees
│   Columns: Sr, employee_id, name, designation, department,
│            cnic, father_name, mother_name, date_of_joining,
│            employment_type, bank_name, bank_account,
│            mode_of_payment, pf_member, eobi_applicable
│
├── Sheet 2: Salary_Rates
│   Columns: employee_id, basic_pay, hra_percentage,
│            utility_percentage, conveyance_percentage
│
├── Sheet 3: Overtime_Rates
│   Columns: employee_id, normal_rate, holiday_rate
│
├── Sheet 4: Rig_Bonus_Rates
│   Columns: employee_id, rate_usd_1, rate_usd_2,
│            usd_conv_rate, daily_travel_rate, travel_conv_rate
│
└── Sheet 5: Monthly_Input
    Columns: employee_id, month, year, absent_days,
             late_coming_hours, leave_without_pay,
             overtime_normal_hours, overtime_holiday_hours,
             rig_bonus_days_1, rig_bonus_days_2,
             travelling_days, advance_salary, meal_allowance,
             arrears, reimbursement, tax_adjustment,
             annual_bonus, loan_deduction, pf_loan,
             other_deductions
```

---

## Create backend/watcher.js

```javascript
const chokidar = require('chokidar');
const path     = require('path');

let pendingFile  = null;
let watcherReady = false;

function startWatching(io) {
  const folder = process.env.WATCH_FOLDER;
  console.log(`Watching folder: ${folder}`);

  const watcher = chokidar.watch(folder, {
    persistent:     true,
    ignoreInitial:  false,
    awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 }
  });

  watcher.on('add', (filePath) => {
    if (filePath.endsWith('.xlsx')) {
      pendingFile = filePath;
      console.log(`New Excel file detected: ${filePath}`);
      if (io) io.emit('excel_detected', {
        file:    path.basename(filePath),
        message: 'New Excel file detected. Import now?'
      });
    }
  });

  watcher.on('change', (filePath) => {
    if (filePath.endsWith('.xlsx')) {
      pendingFile = filePath;
      console.log(`Excel file updated: ${filePath}`);
      if (io) io.emit('excel_detected', {
        file:    path.basename(filePath),
        message: 'Excel file updated. Import now?'
      });
    }
  });

  watcher.on('ready', () => {
    watcherReady = true;
    console.log('Folder watcher ready');
  });
}

function getPendingFile()  { return pendingFile; }
function clearPendingFile(){ pendingFile = null;  }

module.exports = { startWatching, getPendingFile, clearPendingFile };
```

---

## Create backend/controllers/excelController.js

```javascript
const xlsx = require('xlsx');
const pool = require('../db');

async function importExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const results  = {
    employees: 0, salary_rates: 0,
    overtime_rates: 0, rig_bonus_rates: 0, monthly_input: 0,
    errors: []
  };

  // Sheet 1 — Employees
  if (workbook.SheetNames.includes('Employees')) {
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets['Employees']);
    for (const row of rows) {
      try {
        const dept = await pool.query(
          'SELECT id FROM departments WHERE LOWER(name)=LOWER($1)',
          [row.department]
        );
        const deptId = dept.rows[0]?.id || null;
        await pool.query(`
          INSERT INTO employees
            (employee_id, name, designation, department_id, cnic,
             father_name, mother_name, date_of_joining,
             employment_type, bank_name, bank_account,
             mode_of_payment, pf_member, eobi_applicable)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
          ON CONFLICT (employee_id) DO UPDATE SET
            name=$2, designation=$3, department_id=$4,
            bank_name=$10, bank_account=$11, updated_at=NOW()
        `, [
          row.employee_id, row.name, row.designation, deptId,
          row.cnic, row.father_name, row.mother_name,
          row.date_of_joining, row.employment_type || 'permanent',
          row.bank_name, row.bank_account,
          row.mode_of_payment || 'bank',
          row.pf_member === 'YES', row.eobi_applicable !== 'NO'
        ]);
        results.employees++;
      } catch (err) {
        results.errors.push(`Employee ${row.name}: ${err.message}`);
      }
    }
  }

  // Sheet 2 — Salary_Rates
  if (workbook.SheetNames.includes('Salary_Rates')) {
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets['Salary_Rates']);
    for (const row of rows) {
      try {
        const emp = await pool.query(
          'SELECT id FROM employees WHERE employee_id=$1', [row.employee_id]
        );
        if (!emp.rows[0]) continue;
        const basic  = row.basic_pay;
        const perDay = basic / 30;
        const hourly = perDay / 8;
        await pool.query(`
          INSERT INTO salary_structures
            (employee_id, basic_pay, hra_percentage,
             utility_percentage, conveyance_percentage,
             per_day_rate, hourly_rate)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (employee_id)
          DO UPDATE SET basic_pay=$2, hra_percentage=$3,
            utility_percentage=$4, conveyance_percentage=$5,
            per_day_rate=$6, hourly_rate=$7, updated_at=NOW()
        `, [
          emp.rows[0].id, basic,
          row.hra_percentage || 40,
          row.utility_percentage || 5,
          row.conveyance_percentage || 5,
          perDay, hourly
        ]);
        results.salary_rates++;
      } catch (err) {
        results.errors.push(`Salary ${row.employee_id}: ${err.message}`);
      }
    }
  }

  // Sheet 3 — Overtime_Rates
  if (workbook.SheetNames.includes('Overtime_Rates')) {
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets['Overtime_Rates']);
    for (const row of rows) {
      try {
        const emp = await pool.query(
          'SELECT id FROM employees WHERE employee_id=$1', [row.employee_id]
        );
        if (!emp.rows[0]) continue;
        await pool.query(`
          INSERT INTO overtime_rates (employee_id, normal_rate, holiday_rate)
          VALUES ($1,$2,$3)
          ON CONFLICT (employee_id)
          DO UPDATE SET normal_rate=$2, holiday_rate=$3, updated_at=NOW()
        `, [emp.rows[0].id, row.normal_rate, row.holiday_rate]);
        results.overtime_rates++;
      } catch (err) {
        results.errors.push(`OT ${row.employee_id}: ${err.message}`);
      }
    }
  }

  // Sheet 4 — Rig_Bonus_Rates
  if (workbook.SheetNames.includes('Rig_Bonus_Rates')) {
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets['Rig_Bonus_Rates']);
    for (const row of rows) {
      try {
        const emp = await pool.query(
          'SELECT id FROM employees WHERE employee_id=$1', [row.employee_id]
        );
        if (!emp.rows[0]) continue;
        await pool.query(`
          INSERT INTO rig_bonus_rates
            (employee_id, rate_usd_1, rate_usd_2, usd_conv_rate)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (employee_id)
          DO UPDATE SET rate_usd_1=$2, rate_usd_2=$3,
            usd_conv_rate=$4, updated_at=NOW()
        `, [
          emp.rows[0].id,
          row.rate_usd_1 || 0, row.rate_usd_2 || 0,
          row.usd_conv_rate || 278
        ]);
        await pool.query(`
          INSERT INTO travelling_rates (employee_id, daily_rate, conv_rate)
          VALUES ($1,$2,$3)
          ON CONFLICT (employee_id)
          DO UPDATE SET daily_rate=$2, conv_rate=$3, updated_at=NOW()
        `, [
          emp.rows[0].id,
          row.daily_travel_rate || 1500,
          row.travel_conv_rate  || 1
        ]);
        results.rig_bonus_rates++;
      } catch (err) {
        results.errors.push(`Rig ${row.employee_id}: ${err.message}`);
      }
    }
  }

  // Sheet 5 — Monthly_Input
  if (workbook.SheetNames.includes('Monthly_Input')) {
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets['Monthly_Input']);
    for (const row of rows) {
      try {
        const emp = await pool.query(
          'SELECT id FROM employees WHERE employee_id=$1', [row.employee_id]
        );
        if (!emp.rows[0]) continue;
        await pool.query(`
          INSERT INTO monthly_attendance
            (employee_id, month, year, absent_days, late_coming_hours,
             leave_without_pay, overtime_normal_hours,
             overtime_holiday_hours, rig_bonus_days_1, rig_bonus_days_2,
             travelling_days, advance_salary, meal_allowance, arrears,
             reimbursement, tax_adjustment, annual_bonus,
             loan_deduction, pf_loan, other_deductions)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
          ON CONFLICT (employee_id, month, year) DO UPDATE SET
            absent_days=$4, overtime_normal_hours=$7,
            rig_bonus_days_1=$9, travelling_days=$11,
            updated_at=NOW()
        `, [
          emp.rows[0].id, row.month, row.year,
          row.absent_days || 0, row.late_coming_hours || 0,
          row.leave_without_pay || 0,
          row.overtime_normal_hours || 0,
          row.overtime_holiday_hours || 0,
          row.rig_bonus_days_1 || 0, row.rig_bonus_days_2 || 0,
          row.travelling_days || 0, row.advance_salary || 0,
          row.meal_allowance || 0, row.arrears || 0,
          row.reimbursement || 0, row.tax_adjustment || 0,
          row.annual_bonus || 0, row.loan_deduction || 0,
          row.pf_loan || 0, row.other_deductions || 0
        ]);
        results.monthly_input++;
      } catch (err) {
        results.errors.push(`Monthly ${row.employee_id}: ${err.message}`);
      }
    }
  }

  return results;
}

module.exports = { importExcel };
```

---

## Add Excel Import Route — backend/routes/excel.js

```javascript
const express  = require('express');
const router   = express.Router();
const watcher  = require('../watcher');
const { importExcel } = require('../controllers/excelController');

router.get('/pending', (req, res) => {
  const file = watcher.getPendingFile();
  res.json({ success: true, pending: !!file, file });
});

router.post('/import', async (req, res) => {
  const file = watcher.getPendingFile();
  if (!file)
    return res.status(400).json({ success: false, error: 'No pending file to import' });
  try {
    const results = await importExcel(file);
    watcher.clearPendingFile();
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
```

---

## Frontend — Excel Import Notification

Add a notification banner at top of dashboard:

```
New Excel file detected: WellServe-HR-Data.xlsx
[Import Now]  [Remind Later]
```

When HR clicks Import Now:
- Show progress spinner
- Show results: "Imported 190 employees, 190 salary rates, 45 monthly records"
- Show any errors in red
- Close notification

---

## VERIFICATION CHECKLIST

- [ ] Drop Excel file in excel-input/ folder
- [ ] System detects it within 3 seconds
- [ ] Notification appears on frontend
- [ ] Click Import Now → data appears in database
- [ ] All 5 sheets imported correctly
- [ ] Duplicate records update instead of duplicate
- [ ] Errors shown clearly if any row fails

---

## NEXT STEP

Report back with confirmation.
Permission will be given for:
**phases/06-employees.md**

DO NOT proceed without permission.
