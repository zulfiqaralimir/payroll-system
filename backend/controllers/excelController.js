const xlsx = require('xlsx');
const pool = require('../db');

function mapEmploymentType(val) {
  const v = (val || '').toString().toLowerCase().trim();
  if (v === 'contract') return 'contract';
  if (v === 'trainee')  return 'trainee';
  return 'permanent';
}

function mapPaymentMode(val) {
  const v = (val || '').toString().toLowerCase().trim();
  if (v === 'cash') return 'cash';
  return 'bank';
}

// Normalize a raw header string to a lowercase_underscore key
function normalizeKey(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Field alias map — covers capitalized, spaced, abbreviated variants
const ALIASES = {
  // Employees sheet
  employee_id:       ['employee_id','emp_id','empid','id','employeeid','employee id','emp id'],
  name:              ['name','full_name','fullname','employee_name','emp_name','full name','employee name'],
  designation:       ['designation','position','title','job_title','job title'],
  department:        ['department','dept','department_name','dept_name','department name'],
  cnic:              ['cnic','cnic_no','cnic no','national_id','national id','nic'],
  father_name:       ['father_name','fathers_name','father name','father\'s name','fathername'],
  mother_name:       ['mother_name','mothers_name','mother name','mother\'s name','mothername'],
  date_of_joining:   ['date_of_joining','joining_date','doj','date of joining','joining date','join date'],
  employment_type:   ['employment_type','emp_type','type','employment type','emp type'],
  bank_name:         ['bank_name','bank','bank name'],
  bank_account:      ['bank_account','account_no','account','account_number','bank account','account no','account number'],
  mode_of_payment:   ['mode_of_payment','payment_mode','pay_mode','mode of payment','payment mode'],
  pf_member:         ['pf_member','pf','provident_fund','pf member','provident fund'],
  eobi_applicable:   ['eobi_applicable','eobi','eobi applicable'],

  // Salary_Rates sheet
  basic_pay:         ['basic_pay','basic','basic_salary','basic pay','basic salary','gross_pay','gross'],
  hra_percentage:    ['hra_percentage','hra','hra_%','house_rent_%','hra percentage','house rent %','hra%'],
  utility_percentage:['utility_percentage','utility','utility_%','utility percentage','utility%'],
  conveyance_percentage:['conveyance_percentage','conveyance','conveyance_%','conveyance percentage','conveyance%'],

  // Overtime_Rates sheet
  normal_rate:       ['normal_rate','ot_rate','normal_ot_rate','ot rate','normal rate','overtime_rate','overtime rate'],
  holiday_rate:      ['holiday_rate','holiday_ot_rate','holiday ot rate','holiday rate'],

  // Rig_Bonus_Rates sheet
  rate_usd_1:        ['rate_usd_1','rig_rate_1','rig_bonus_1','rate usd 1','rig rate 1','rig bonus 1','rate_1','usd_rate_1'],
  rate_usd_2:        ['rate_usd_2','rig_rate_2','rig_bonus_2','rate usd 2','rig rate 2','rig bonus 2','rate_2','usd_rate_2'],
  usd_conv_rate:     ['usd_conv_rate','conv_rate','usd_rate','usd conversion','usd conv rate','usd to pkr','conversion_rate'],
  daily_travel_rate: ['daily_travel_rate','travel_rate','travelling_rate','daily travel rate','travel rate','travelling rate','daily_rate'],
  travel_conv_rate:  ['travel_conv_rate','travel_conversion','travel conv rate','travel conversion rate','travelling_conv'],

  // Monthly_Input sheet
  month:             ['month','month_no','month no'],
  year:              ['year','yr'],
  absent_days:       ['absent_days','absences','absent days','days_absent','days absent'],
  late_coming_hours: ['late_coming_hours','late_hours','late coming hours','late hours','lc_hours'],
  leave_without_pay: ['leave_without_pay','lwp','leave without pay','lwp_days','lwp days'],
  overtime_normal_hours:  ['overtime_normal_hours','ot_normal','normal_ot_hours','overtime normal hours','normal ot hours','ot_hours','ot hours'],
  overtime_holiday_hours: ['overtime_holiday_hours','ot_holiday','holiday_ot_hours','overtime holiday hours','holiday ot hours'],
  rig_bonus_days_1:  ['rig_bonus_days_1','rig_days_1','rig bonus days 1','rig days 1','rig1_days','rig1 days'],
  rig_bonus_days_2:  ['rig_bonus_days_2','rig_days_2','rig bonus days 2','rig days 2','rig2_days','rig2 days'],
  travelling_days:   ['travelling_days','travel_days','travelling days','travel days'],
  advance_salary:    ['advance_salary','advance','salary_advance','advance salary','salary advance'],
  meal_allowance:    ['meal_allowance','meal','meals','meal allowance'],
  arrears:           ['arrears','arrear'],
  reimbursement:     ['reimbursement','reimburse','reimbursements'],
  tax_adjustment:    ['tax_adjustment','tax_adj','tax adjustment','tax adj'],
  annual_bonus:      ['annual_bonus','bonus','yearly_bonus','annual bonus','yearly bonus'],
  loan_deduction:    ['loan_deduction','loan','loan deduction','loan_ded'],
  pf_loan:           ['pf_loan','pf_loan_deduction','pf loan','pf loan deduction'],
  other_deductions:  ['other_deductions','others','other deductions','misc_deductions','misc deductions'],
};

// Build reverse lookup: alias → canonical key
const ALIAS_LOOKUP = {};
for (const [canonical, variants] of Object.entries(ALIASES)) {
  for (const v of variants) {
    ALIAS_LOOKUP[v] = canonical;
  }
}

// Resolve a normalized raw key to a canonical field name
function resolveKey(rawKey) {
  const normalized = normalizeKey(rawKey);
  return ALIAS_LOOKUP[normalized] || normalized;
}

// Keywords that indicate a row is likely a header row (not data, not a title)
const HEADER_KEYWORDS = [
  'employee_id','emp_id','empid','name','employee','id',
  'designation','department','basic','salary','rate','ot','month','year',
  'cnic','bank','joining','type','payment',
];

function looksLikeHeaderRow(rawRow) {
  const cells = rawRow.map(c => normalizeKey((c || '').toString()));
  const matches = cells.filter(c => HEADER_KEYWORDS.some(k => c.includes(k)));
  return matches.length >= 2;
}

// Read a sheet, auto-detect the header row, return normalized row objects
function getSheetRows(sheet) {
  const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!raw.length) return [];

  // Scan first 10 rows for the header row
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(10, raw.length); i++) {
    if (looksLikeHeaderRow(raw[i])) {
      headerRowIdx = i;
      break;
    }
  }

  const headers = raw[headerRowIdx].map(resolveKey);
  const rows = [];
  for (let i = headerRowIdx + 1; i < raw.length; i++) {
    const rowArr = raw[i];
    // Skip completely empty rows
    if (rowArr.every(c => c === '' || c === null || c === undefined)) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = rowArr[idx] ?? '';
    });
    rows.push(obj);
  }
  return rows;
}

async function importExcel(input) {
  const workbook = Buffer.isBuffer(input)
    ? xlsx.read(input, { type: 'buffer' })
    : xlsx.readFile(input);

  const results = {
    employees: 0, salary_rates: 0,
    overtime_rates: 0, rig_bonus_rates: 0, monthly_input: 0,
    errors: []
  };

  // ── Sheet 1: Employees ──────────────────────────────────────────
  const empSheet = workbook.SheetNames.find(n => /employee/i.test(n));
  if (empSheet) {
    const rows = getSheetRows(workbook.Sheets[empSheet]);
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
            bank_name=$10, bank_account=$11,
            mode_of_payment=$12, pf_member=$13, eobi_applicable=$14,
            is_active=true, updated_at=NOW()
        `, [
          row.employee_id,
          row.name,
          row.designation,
          deptId,
          row.cnic             || null,
          row.father_name      || null,
          row.mother_name      || null,
          row.date_of_joining  || null,
          mapEmploymentType(row.employment_type),
          row.bank_name        || null,
          row.bank_account     || null,
          mapPaymentMode(row.mode_of_payment),
          (row.pf_member    === 'YES' || row.pf_member    === true  || row.pf_member    === 1),
          !(row.eobi_applicable === 'NO'  || row.eobi_applicable === false || row.eobi_applicable === 0)
        ]);
        results.employees++;
      } catch (err) {
        results.errors.push(`Employee "${row.name || row.employee_id}": ${err.message}`);
      }
    }
  }

  // ── Sheet 2: Salary_Rates ───────────────────────────────────────
  const salSheet = workbook.SheetNames.find(n => /salary/i.test(n));
  if (salSheet) {
    const rows = getSheetRows(workbook.Sheets[salSheet]);
    for (const row of rows) {
      try {
        const emp = await pool.query(
          'SELECT id FROM employees WHERE employee_id=$1', [row.employee_id]
        );
        if (!emp.rows[0]) {
          results.errors.push(`Salary: employee "${row.employee_id}" not found`);
          continue;
        }
        const basic  = parseFloat(row.basic_pay) || 0;
        const perDay = basic / 30;
        const hourly = perDay / 8;
        await pool.query(`
          INSERT INTO salary_structures
            (employee_id, basic_pay, hra_percentage,
             utility_percentage, conveyance_percentage,
             per_day_rate, hourly_rate)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (employee_id) DO UPDATE SET
            basic_pay=$2, hra_percentage=$3,
            utility_percentage=$4, conveyance_percentage=$5,
            per_day_rate=$6, hourly_rate=$7, updated_at=NOW()
        `, [
          emp.rows[0].id, basic,
          parseFloat(row.hra_percentage)         || 40,
          parseFloat(row.utility_percentage)     || 5,
          parseFloat(row.conveyance_percentage)  || 5,
          perDay, hourly
        ]);
        results.salary_rates++;
      } catch (err) {
        results.errors.push(`Salary "${row.employee_id}": ${err.message}`);
      }
    }
  }

  // ── Sheet 3: Overtime_Rates ─────────────────────────────────────
  const otSheet = workbook.SheetNames.find(n => /overtime/i.test(n));
  if (otSheet) {
    const rows = getSheetRows(workbook.Sheets[otSheet]);
    for (const row of rows) {
      try {
        const emp = await pool.query(
          'SELECT id FROM employees WHERE employee_id=$1', [row.employee_id]
        );
        if (!emp.rows[0]) {
          results.errors.push(`OT: employee "${row.employee_id}" not found`);
          continue;
        }
        await pool.query(`
          INSERT INTO overtime_rates (employee_id, normal_rate, holiday_rate)
          VALUES ($1,$2,$3)
          ON CONFLICT (employee_id) DO UPDATE SET
            normal_rate=$2, holiday_rate=$3, updated_at=NOW()
        `, [
          emp.rows[0].id,
          parseFloat(row.normal_rate)  || 0,
          parseFloat(row.holiday_rate) || 0
        ]);
        results.overtime_rates++;
      } catch (err) {
        results.errors.push(`OT "${row.employee_id}": ${err.message}`);
      }
    }
  }

  // ── Sheet 4: Rig_Bonus_Rates ────────────────────────────────────
  const rigSheet = workbook.SheetNames.find(n => /rig/i.test(n));
  if (rigSheet) {
    const rows = getSheetRows(workbook.Sheets[rigSheet]);
    for (const row of rows) {
      try {
        const emp = await pool.query(
          'SELECT id FROM employees WHERE employee_id=$1', [row.employee_id]
        );
        if (!emp.rows[0]) {
          results.errors.push(`Rig: employee "${row.employee_id}" not found`);
          continue;
        }
        await pool.query(`
          INSERT INTO rig_bonus_rates
            (employee_id, rate_usd_1, rate_usd_2, usd_conv_rate)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (employee_id) DO UPDATE SET
            rate_usd_1=$2, rate_usd_2=$3, usd_conv_rate=$4, updated_at=NOW()
        `, [
          emp.rows[0].id,
          parseFloat(row.rate_usd_1)    || 0,
          parseFloat(row.rate_usd_2)    || 0,
          parseFloat(row.usd_conv_rate) || 278
        ]);
        await pool.query(`
          INSERT INTO travelling_rates (employee_id, daily_rate, conv_rate)
          VALUES ($1,$2,$3)
          ON CONFLICT (employee_id) DO UPDATE SET
            daily_rate=$2, conv_rate=$3, updated_at=NOW()
        `, [
          emp.rows[0].id,
          parseFloat(row.daily_travel_rate) || 1500,
          parseFloat(row.travel_conv_rate)  || 1
        ]);
        results.rig_bonus_rates++;
      } catch (err) {
        results.errors.push(`Rig "${row.employee_id}": ${err.message}`);
      }
    }
  }

  // ── Sheet 5: Monthly_Input ──────────────────────────────────────
  const monSheet = workbook.SheetNames.find(n => /monthly/i.test(n));
  if (monSheet) {
    const rows = getSheetRows(workbook.Sheets[monSheet]);
    for (const row of rows) {
      try {
        const emp = await pool.query(
          'SELECT id FROM employees WHERE employee_id=$1', [row.employee_id]
        );
        if (!emp.rows[0]) {
          results.errors.push(`Monthly: employee "${row.employee_id}" not found`);
          continue;
        }
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
            absent_days=$4, late_coming_hours=$5,
            leave_without_pay=$6, overtime_normal_hours=$7,
            overtime_holiday_hours=$8, rig_bonus_days_1=$9,
            rig_bonus_days_2=$10, travelling_days=$11,
            advance_salary=$12, meal_allowance=$13, arrears=$14,
            reimbursement=$15, tax_adjustment=$16, annual_bonus=$17,
            loan_deduction=$18, pf_loan=$19, other_deductions=$20,
            updated_at=NOW()
        `, [
          emp.rows[0].id,
          parseInt(row.month)  || 1,
          parseInt(row.year)   || new Date().getFullYear(),
          parseFloat(row.absent_days)             || 0,
          parseFloat(row.late_coming_hours)       || 0,
          parseFloat(row.leave_without_pay)       || 0,
          parseFloat(row.overtime_normal_hours)   || 0,
          parseFloat(row.overtime_holiday_hours)  || 0,
          parseFloat(row.rig_bonus_days_1)        || 0,
          parseFloat(row.rig_bonus_days_2)        || 0,
          parseFloat(row.travelling_days)         || 0,
          parseFloat(row.advance_salary)          || 0,
          parseFloat(row.meal_allowance)          || 0,
          parseFloat(row.arrears)                 || 0,
          parseFloat(row.reimbursement)           || 0,
          parseFloat(row.tax_adjustment)          || 0,
          parseFloat(row.annual_bonus)            || 0,
          parseFloat(row.loan_deduction)          || 0,
          parseFloat(row.pf_loan)                 || 0,
          parseFloat(row.other_deductions)        || 0
        ]);
        results.monthly_input++;
      } catch (err) {
        results.errors.push(`Monthly "${row.employee_id}": ${err.message}`);
      }
    }
  }

  return results;
}

module.exports = { importExcel };
