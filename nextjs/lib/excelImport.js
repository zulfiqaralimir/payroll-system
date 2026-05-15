import * as xlsx from 'xlsx';
import pool from './db';

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

function normalizeKey(str) {
  return (str || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function parseDate(val) {
  if (!val && val !== 0) return null;
  if (val instanceof Date) return isNaN(val) ? null : val.toISOString().slice(0, 10);
  if (typeof val === 'number') {
    // Excel serial date number
    try {
      const info = xlsx.SSF.parse_date_code(val);
      if (info) return `${info.y}-${String(info.m).padStart(2,'0')}-${String(info.d).padStart(2,'0')}`;
    } catch {}
  }
  const s = String(val).trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function dedupeById(rows, key = 'employee_id') {
  const seen = new Map();
  for (const row of rows) {
    const id = String(row[key] ?? '').trim();
    if (id) seen.set(id, row);
  }
  return [...seen.values()];
}

const ALIASES = {
  employee_id:              ['employee_id','emp_id','empid','id','employeeid','employee id','emp id'],
  name:                     ['name','full_name','fullname','employee_name','emp_name','full name','employee name'],
  designation:              ['designation','position','title','job_title','job title'],
  department:               ['department','dept','department_name','dept_name','department name'],
  cnic:                     ['cnic','cnic_no','cnic no','national_id','national id','nic'],
  father_name:              ['father_name','fathers_name','father name',"father's name",'fathername'],
  mother_name:              ['mother_name','mothers_name','mother name',"mother's name",'mothername'],
  date_of_joining:          ['date_of_joining','joining_date','doj','date of joining','joining date','join date'],
  employment_type:          ['employment_type','emp_type','type','employment type','emp type'],
  bank_name:                ['bank_name','bank','bank name'],
  bank_account:             ['bank_account','account_no','account','account_number','bank account','account no','account number'],
  mode_of_payment:          ['mode_of_payment','payment_mode','pay_mode','mode of payment','payment mode'],
  pf_member:                ['pf_member','pf','provident_fund','pf member','provident fund'],
  eobi_applicable:          ['eobi_applicable','eobi','eobi applicable'],
  basic_pay:                ['basic_pay','basic','basic_salary','basic pay','basic salary','gross_pay','gross'],
  hra_percentage:           ['hra_percentage','hra','hra_%','house_rent_%','hra percentage','house rent %','hra%'],
  utility_percentage:       ['utility_percentage','utility','utility_%','utility percentage','utility%'],
  conveyance_percentage:    ['conveyance_percentage','conveyance','conveyance_%','conveyance percentage','conveyance%'],
  normal_rate:              ['normal_rate','ot_rate','normal_ot_rate','ot rate','normal rate','overtime_rate','overtime rate'],
  holiday_rate:             ['holiday_rate','holiday_ot_rate','holiday ot rate','holiday rate'],
  rate_usd_1:               ['rate_usd_1','rig_rate_1','rig_bonus_1','rate usd 1','rig rate 1','rig bonus 1','rate_1','usd_rate_1'],
  rate_usd_2:               ['rate_usd_2','rig_rate_2','rig_bonus_2','rate usd 2','rig rate 2','rig bonus 2','rate_2','usd_rate_2'],
  usd_conv_rate:            ['usd_conv_rate','conv_rate','usd_rate','usd conversion','usd conv rate','usd to pkr','conversion_rate'],
  daily_travel_rate:        ['daily_travel_rate','travel_rate','travelling_rate','daily travel rate','travel rate','travelling rate','daily_rate'],
  travel_conv_rate:         ['travel_conv_rate','travel_conversion','travel conv rate','travel conversion rate','travelling_conv'],
  month:                    ['month','month_no','month no'],
  year:                     ['year','yr'],
  absent_days:              ['absent_days','absences','absent days','days_absent','days absent'],
  late_coming_hours:        ['late_coming_hours','late_hours','late coming hours','late hours','lc_hours'],
  leave_without_pay:        ['leave_without_pay','lwp','leave without pay','lwp_days','lwp days'],
  overtime_normal_hours:    ['overtime_normal_hours','ot_normal','normal_ot_hours','overtime normal hours','normal ot hours','ot_hours','ot hours'],
  overtime_holiday_hours:   ['overtime_holiday_hours','ot_holiday','holiday_ot_hours','overtime holiday hours','holiday ot hours'],
  rig_bonus_days_1:         ['rig_bonus_days_1','rig_days_1','rig bonus days 1','rig days 1','rig1_days','rig1 days'],
  rig_bonus_days_2:         ['rig_bonus_days_2','rig_days_2','rig bonus days 2','rig days 2','rig2_days','rig2 days'],
  travelling_days:          ['travelling_days','travel_days','travelling days','travel days'],
  advance_salary:           ['advance_salary','advance','salary_advance','advance salary','salary advance'],
  meal_allowance:           ['meal_allowance','meal','meals','meal allowance'],
  arrears:                  ['arrears','arrear'],
  reimbursement:            ['reimbursement','reimburse','reimbursements'],
  tax_adjustment:           ['tax_adjustment','tax_adj','tax adjustment','tax adj'],
  annual_bonus:             ['annual_bonus','bonus','yearly_bonus','annual bonus','yearly bonus'],
  loan_deduction:           ['loan_deduction','loan','loan deduction','loan_ded'],
  pf_loan:                  ['pf_loan','pf_loan_deduction','pf loan','pf loan deduction'],
  other_deductions:         ['other_deductions','others','other deductions','misc_deductions','misc deductions'],
  religion:                 ['religion','faith','religious'],
  rig_bonus_eligible:       ['rig_bonus_eligible','rig_eligible','rig bonus eligible','rig_bonus','rig bonus'],
};

const ALIAS_LOOKUP = {};
for (const [canonical, variants] of Object.entries(ALIASES)) {
  for (const v of variants) ALIAS_LOOKUP[v] = canonical;
}

function resolveKey(rawKey) {
  const n = normalizeKey(rawKey);
  return ALIAS_LOOKUP[n] || n;
}

const HEADER_KEYWORDS = [
  'employee_id','emp_id','empid','name','employee','id',
  'designation','department','basic','salary','rate','ot','month','year',
  'cnic','bank','joining','type','payment',
];

function looksLikeHeaderRow(rawRow) {
  const cells = rawRow.map(c => normalizeKey((c || '').toString()));
  return cells.filter(c => HEADER_KEYWORDS.some(k => c.includes(k))).length >= 2;
}

function getSheetRows(sheet) {
  const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!raw.length) return [];
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(10, raw.length); i++) {
    if (looksLikeHeaderRow(raw[i])) { headerRowIdx = i; break; }
  }
  const headers = raw[headerRowIdx].map(resolveKey);
  const rows = [];
  for (let i = headerRowIdx + 1; i < raw.length; i++) {
    const rowArr = raw[i];
    if (rowArr.every(c => c === '' || c === null || c === undefined)) continue;
    const obj = {};
    headers.forEach((h, idx) => { if (h) obj[h] = rowArr[idx] ?? ''; });
    rows.push(obj);
  }
  return rows;
}

export async function importExcelBuffer(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const results = { employees: 0, salary_rates: 0, overtime_rates: 0, rig_bonus_rates: 0, monthly_input: 0, errors: [] };

  // Pre-load all departments and existing employees in 2 queries total
  const [deptRes, empRes] = await Promise.all([
    pool.query('SELECT id, LOWER(name) AS name FROM departments'),
    pool.query('SELECT id, employee_id FROM employees'),
  ]);
  const deptMap = new Map(deptRes.rows.map(r => [r.name, r.id]));
  let empMap  = new Map(empRes.rows.map(r => [r.employee_id, r.id]));

  // ── Sheet 1: Employees ──────────────────────────────────────────────────────
  const empSheet = workbook.SheetNames.find(n => /employee/i.test(n));
  if (empSheet) {
    const rows = dedupeById(getSheetRows(workbook.Sheets[empSheet]));
    if (rows.length) {
      const cols = {
        employee_id: [], name: [], designation: [], department_id: [],
        cnic: [], father_name: [], mother_name: [], date_of_joining: [],
        employment_type: [], bank_name: [], bank_account: [],
        mode_of_payment: [], pf_member: [], eobi_applicable: [],
        religion: [], rig_bonus_eligible: [],
      };
      for (const row of rows) {
        cols.employee_id.push(String(row.employee_id).trim());
        cols.name.push(row.name || null);
        cols.designation.push(row.designation || null);
        cols.department_id.push(deptMap.get((row.department || '').toLowerCase()) || null);
        cols.cnic.push(row.cnic || null);
        cols.father_name.push(row.father_name || null);
        cols.mother_name.push(row.mother_name || null);
        cols.date_of_joining.push(parseDate(row.date_of_joining));
        cols.employment_type.push(mapEmploymentType(row.employment_type));
        cols.bank_name.push(row.bank_name || null);
        cols.bank_account.push(row.bank_account || null);
        cols.mode_of_payment.push(mapPaymentMode(row.mode_of_payment));
        cols.pf_member.push(row.pf_member === 'YES' || row.pf_member === true || row.pf_member === 1);
        cols.eobi_applicable.push(!(row.eobi_applicable === 'NO' || row.eobi_applicable === false || row.eobi_applicable === 0));
        cols.religion.push(row.religion || null);
        cols.rig_bonus_eligible.push(!(row.rig_bonus_eligible === 'NO' || row.rig_bonus_eligible === false || row.rig_bonus_eligible === 0));
      }
      if (cols.employee_id.length) {
        try {
          await pool.query(`
            INSERT INTO employees
              (employee_id,name,designation,department_id,cnic,father_name,mother_name,
               date_of_joining,employment_type,bank_name,bank_account,mode_of_payment,
               pf_member,eobi_applicable,religion,rig_bonus_eligible)
            SELECT * FROM unnest(
              $1::text[], $2::text[], $3::text[], $4::int[],
              $5::text[], $6::text[], $7::text[], $8::date[],
              $9::text[], $10::text[], $11::text[], $12::text[],
              $13::bool[], $14::bool[], $15::text[], $16::bool[]
            ) AS t(employee_id,name,designation,department_id,cnic,father_name,mother_name,
                   date_of_joining,employment_type,bank_name,bank_account,mode_of_payment,
                   pf_member,eobi_applicable,religion,rig_bonus_eligible)
            ON CONFLICT (employee_id) DO UPDATE SET
              name=EXCLUDED.name, designation=EXCLUDED.designation, department_id=EXCLUDED.department_id,
              bank_name=EXCLUDED.bank_name, bank_account=EXCLUDED.bank_account,
              mode_of_payment=EXCLUDED.mode_of_payment, pf_member=EXCLUDED.pf_member,
              eobi_applicable=EXCLUDED.eobi_applicable, religion=EXCLUDED.religion,
              rig_bonus_eligible=EXCLUDED.rig_bonus_eligible, is_active=true, updated_at=NOW()
          `, [
            cols.employee_id, cols.name, cols.designation, cols.department_id,
            cols.cnic, cols.father_name, cols.mother_name, cols.date_of_joining,
            cols.employment_type, cols.bank_name, cols.bank_account, cols.mode_of_payment,
            cols.pf_member, cols.eobi_applicable, cols.religion, cols.rig_bonus_eligible,
          ]);
          results.employees = cols.employee_id.length;
          const refreshed = await pool.query('SELECT id, employee_id FROM employees');
          empMap = new Map(refreshed.rows.map(r => [r.employee_id, r.id]));
        } catch (err) {
          results.errors.push(`Employees bulk insert: ${err.message}`);
        }
      }
    }
  }

  // ── Sheet 2: Salary_Rates ───────────────────────────────────────────────────
  const salSheet = workbook.SheetNames.find(n => /salary/i.test(n));
  if (salSheet) {
    const rows = dedupeById(getSheetRows(workbook.Sheets[salSheet]));
    const cols = { emp_id: [], basic: [], hra: [], utility: [], conveyance: [], per_day: [], hourly: [] };
    for (const row of rows) {
      const dbId = empMap.get(String(row.employee_id).trim());
      if (!dbId) { results.errors.push(`Salary: employee "${row.employee_id}" not found`); continue; }
      const basic = parseFloat(row.basic_pay) || 0;
      cols.emp_id.push(dbId);
      cols.basic.push(basic);
      cols.hra.push(parseFloat(row.hra_percentage) || 40);
      cols.utility.push(parseFloat(row.utility_percentage) || 5);
      cols.conveyance.push(parseFloat(row.conveyance_percentage) || 5);
      cols.per_day.push(basic / 30);
      cols.hourly.push(basic / 30 / 8);
    }
    if (cols.emp_id.length) {
      try {
        await pool.query(`
          INSERT INTO salary_structures
            (employee_id,basic_pay,hra_percentage,utility_percentage,conveyance_percentage,per_day_rate,hourly_rate)
          SELECT * FROM unnest($1::int[],$2::numeric[],$3::numeric[],$4::numeric[],$5::numeric[],$6::numeric[],$7::numeric[])
            AS t(employee_id,basic_pay,hra_percentage,utility_percentage,conveyance_percentage,per_day_rate,hourly_rate)
          ON CONFLICT (employee_id) DO UPDATE SET
            basic_pay=EXCLUDED.basic_pay, hra_percentage=EXCLUDED.hra_percentage,
            utility_percentage=EXCLUDED.utility_percentage, conveyance_percentage=EXCLUDED.conveyance_percentage,
            per_day_rate=EXCLUDED.per_day_rate, hourly_rate=EXCLUDED.hourly_rate, updated_at=NOW()
        `, [cols.emp_id, cols.basic, cols.hra, cols.utility, cols.conveyance, cols.per_day, cols.hourly]);
        results.salary_rates = cols.emp_id.length;
      } catch (err) {
        results.errors.push(`Salary bulk insert: ${err.message}`);
      }
    }
  }

  // ── Sheet 3: Overtime_Rates ─────────────────────────────────────────────────
  const otSheet = workbook.SheetNames.find(n => /overtime/i.test(n));
  if (otSheet) {
    const rows = dedupeById(getSheetRows(workbook.Sheets[otSheet]));
    const cols = { emp_id: [], normal: [], holiday: [] };
    for (const row of rows) {
      const dbId = empMap.get(String(row.employee_id).trim());
      if (!dbId) { results.errors.push(`OT: employee "${row.employee_id}" not found`); continue; }
      cols.emp_id.push(dbId);
      cols.normal.push(parseFloat(row.normal_rate) || 0);
      cols.holiday.push(parseFloat(row.holiday_rate) || 0);
    }
    if (cols.emp_id.length) {
      try {
        await pool.query(`
          INSERT INTO overtime_rates (employee_id,normal_rate,holiday_rate)
          SELECT * FROM unnest($1::int[],$2::numeric[],$3::numeric[])
            AS t(employee_id,normal_rate,holiday_rate)
          ON CONFLICT (employee_id) DO UPDATE SET
            normal_rate=EXCLUDED.normal_rate, holiday_rate=EXCLUDED.holiday_rate, updated_at=NOW()
        `, [cols.emp_id, cols.normal, cols.holiday]);
        results.overtime_rates = cols.emp_id.length;
      } catch (err) {
        results.errors.push(`Overtime bulk insert: ${err.message}`);
      }
    }
  }

  // ── Sheet 4: Rig_Bonus_Rates ────────────────────────────────────────────────
  const rigSheet = workbook.SheetNames.find(n => /rig/i.test(n));
  if (rigSheet) {
    const rows = dedupeById(getSheetRows(workbook.Sheets[rigSheet]));
    const rig = { emp_id: [], r1: [], r2: [], conv: [] };
    const trav = { emp_id: [], daily: [], tconv: [] };
    for (const row of rows) {
      const dbId = empMap.get(String(row.employee_id).trim());
      if (!dbId) { results.errors.push(`Rig: employee "${row.employee_id}" not found`); continue; }
      rig.emp_id.push(dbId);
      rig.r1.push(parseFloat(row.rate_usd_1) || 0);
      rig.r2.push(parseFloat(row.rate_usd_2) || 0);
      rig.conv.push(parseFloat(row.usd_conv_rate) || 278);
      trav.emp_id.push(dbId);
      trav.daily.push(parseFloat(row.daily_travel_rate) || 1500);
      trav.tconv.push(parseFloat(row.travel_conv_rate) || 1);
    }
    if (rig.emp_id.length) {
      try {
        await Promise.all([
          pool.query(`
            INSERT INTO rig_bonus_rates (employee_id,rate_usd_1,rate_usd_2,usd_conv_rate)
            SELECT * FROM unnest($1::int[],$2::numeric[],$3::numeric[],$4::numeric[])
              AS t(employee_id,rate_usd_1,rate_usd_2,usd_conv_rate)
            ON CONFLICT (employee_id) DO UPDATE SET
              rate_usd_1=EXCLUDED.rate_usd_1, rate_usd_2=EXCLUDED.rate_usd_2,
              usd_conv_rate=EXCLUDED.usd_conv_rate, updated_at=NOW()
          `, [rig.emp_id, rig.r1, rig.r2, rig.conv]),
          pool.query(`
            INSERT INTO travelling_rates (employee_id,daily_rate,conv_rate)
            SELECT * FROM unnest($1::int[],$2::numeric[],$3::numeric[])
              AS t(employee_id,daily_rate,conv_rate)
            ON CONFLICT (employee_id) DO UPDATE SET
              daily_rate=EXCLUDED.daily_rate, conv_rate=EXCLUDED.conv_rate, updated_at=NOW()
          `, [trav.emp_id, trav.daily, trav.tconv]),
        ]);
        results.rig_bonus_rates = rig.emp_id.length;
      } catch (err) {
        results.errors.push(`Rig bulk insert: ${err.message}`);
      }
    }
  }

  // ── Sheet 5: Monthly_Input ──────────────────────────────────────────────────
  const monSheet = workbook.SheetNames.find(n => /monthly/i.test(n));
  if (monSheet) {
    // Deduplicate by composite key employee_id + month + year
    const monSeen = new Map();
    for (const row of getSheetRows(workbook.Sheets[monSheet])) {
      const key = `${String(row.employee_id).trim()}-${row.month}-${row.year}`;
      if (key !== '--') monSeen.set(key, row);
    }
    const rows = [...monSeen.values()];
    const c = {
      emp_id: [], month: [], year: [],
      absent: [], late: [], lwp: [], ot_normal: [], ot_holiday: [],
      rig1: [], rig2: [], trav: [], advance: [], meal: [], arrears: [],
      reimb: [], tax_adj: [], bonus: [], loan: [], pf_loan: [], other: [],
    };
    for (const row of rows) {
      const dbId = empMap.get(String(row.employee_id).trim());
      if (!dbId) { results.errors.push(`Monthly: employee "${row.employee_id}" not found`); continue; }
      c.emp_id.push(dbId);
      c.month.push(parseInt(row.month) || 1);
      c.year.push(parseInt(row.year) || new Date().getFullYear());
      c.absent.push(parseFloat(row.absent_days) || 0);
      c.late.push(parseFloat(row.late_coming_hours) || 0);
      c.lwp.push(parseFloat(row.leave_without_pay) || 0);
      c.ot_normal.push(parseFloat(row.overtime_normal_hours) || 0);
      c.ot_holiday.push(parseFloat(row.overtime_holiday_hours) || 0);
      c.rig1.push(parseFloat(row.rig_bonus_days_1) || 0);
      c.rig2.push(parseFloat(row.rig_bonus_days_2) || 0);
      c.trav.push(parseFloat(row.travelling_days) || 0);
      c.advance.push(parseFloat(row.advance_salary) || 0);
      c.meal.push(parseFloat(row.meal_allowance) || 0);
      c.arrears.push(parseFloat(row.arrears) || 0);
      c.reimb.push(parseFloat(row.reimbursement) || 0);
      c.tax_adj.push(parseFloat(row.tax_adjustment) || 0);
      c.bonus.push(parseFloat(row.annual_bonus) || 0);
      c.loan.push(parseFloat(row.loan_deduction) || 0);
      c.pf_loan.push(parseFloat(row.pf_loan) || 0);
      c.other.push(parseFloat(row.other_deductions) || 0);
    }
    if (c.emp_id.length) {
      try {
        await pool.query(`
          INSERT INTO monthly_attendance
            (employee_id,month,year,absent_days,late_coming_hours,leave_without_pay,
             overtime_normal_hours,overtime_holiday_hours,rig_bonus_days_1,rig_bonus_days_2,
             travelling_days,advance_salary,meal_allowance,arrears,reimbursement,
             tax_adjustment,annual_bonus,loan_deduction,pf_loan,other_deductions)
          SELECT * FROM unnest(
            $1::int[], $2::int[], $3::int[],
            $4::numeric[], $5::numeric[], $6::numeric[],
            $7::numeric[], $8::numeric[], $9::numeric[], $10::numeric[],
            $11::numeric[], $12::numeric[], $13::numeric[], $14::numeric[], $15::numeric[],
            $16::numeric[], $17::numeric[], $18::numeric[], $19::numeric[], $20::numeric[]
          ) AS t(employee_id,month,year,absent_days,late_coming_hours,leave_without_pay,
                 overtime_normal_hours,overtime_holiday_hours,rig_bonus_days_1,rig_bonus_days_2,
                 travelling_days,advance_salary,meal_allowance,arrears,reimbursement,
                 tax_adjustment,annual_bonus,loan_deduction,pf_loan,other_deductions)
          ON CONFLICT (employee_id,month,year) DO UPDATE SET
            absent_days=EXCLUDED.absent_days, late_coming_hours=EXCLUDED.late_coming_hours,
            leave_without_pay=EXCLUDED.leave_without_pay,
            overtime_normal_hours=EXCLUDED.overtime_normal_hours,
            overtime_holiday_hours=EXCLUDED.overtime_holiday_hours,
            rig_bonus_days_1=EXCLUDED.rig_bonus_days_1, rig_bonus_days_2=EXCLUDED.rig_bonus_days_2,
            travelling_days=EXCLUDED.travelling_days, advance_salary=EXCLUDED.advance_salary,
            meal_allowance=EXCLUDED.meal_allowance, arrears=EXCLUDED.arrears,
            reimbursement=EXCLUDED.reimbursement, tax_adjustment=EXCLUDED.tax_adjustment,
            annual_bonus=EXCLUDED.annual_bonus, loan_deduction=EXCLUDED.loan_deduction,
            pf_loan=EXCLUDED.pf_loan, other_deductions=EXCLUDED.other_deductions,
            updated_at=NOW()
        `, [
          c.emp_id, c.month, c.year,
          c.absent, c.late, c.lwp, c.ot_normal, c.ot_holiday,
          c.rig1, c.rig2, c.trav, c.advance, c.meal, c.arrears,
          c.reimb, c.tax_adj, c.bonus, c.loan, c.pf_loan, c.other,
        ]);
        results.monthly_input = c.emp_id.length;
      } catch (err) {
        results.errors.push(`Monthly bulk insert: ${err.message}`);
      }
    }
  }

  return results;
}

export function inspectExcelBuffer(buffer) {
  const wb = xlsx.read(buffer, { type: 'buffer' });
  const rows = {};
  for (const name of wb.SheetNames) {
    rows[name] = xlsx.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' }).slice(0, 5);
  }
  return { sheets: wb.SheetNames, rows };
}
