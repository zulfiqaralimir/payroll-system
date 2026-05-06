# Phase 03 — Backend API
> WellServe HR Payroll System
> Only start after Phase 02 is complete and confirmed.

---

## GOAL
Build a complete, organized Node.js + Express backend with:
- All API routes for every table
- Input validation
- Error handling
- Response formatting
- CORS configured
- Environment config

---

## FOLDER STRUCTURE

```
backend/
├── server.js
├── db.js
├── .env
├── routes/
│   ├── departments.js
│   ├── employees.js
│   ├── salaryStructures.js
│   ├── overtimeRates.js
│   ├── rigBonusRates.js
│   ├── travellingRates.js
│   ├── taxSlabs.js
│   ├── accountCodes.js
│   ├── banks.js
│   ├── pfSchemes.js
│   ├── attendance.js
│   ├── deductions.js
│   ├── payroll.js
│   ├── payslips.js
│   ├── bankTransfers.js
│   ├── pfEobi.js
│   ├── jvEntries.js
│   ├── users.js
│   └── auditLog.js
├── controllers/
│   ├── payrollController.js   ← salary calculation logic
│   └── excelController.js     ← excel import logic
└── middleware/
    ├── auth.js                ← JWT verification
    ├── roleCheck.js           ← role-based access
    └── errorHandler.js        ← global error handler
```

---

## Install additional packages

```bash
npm install bcryptjs jsonwebtoken express-validator multer xlsx chokidar puppeteer
```

---

## Standard API response format

All API responses must follow this format:

```javascript
// Success
{
  "success": true,
  "data": [...],
  "message": "Fetched successfully",
  "count": 15
}

// Error
{
  "success": false,
  "error": "Error message here"
}
```

---

## Payroll Calculation Logic
Create backend/controllers/payrollController.js:

```javascript
// Calculate gross salary for one employee for one month
async function calculateGross(employee, salaryStructure,
                               overtimeRate, rigBonusRate,
                               travellingRate, attendance) {
  const basic         = salaryStructure.basic_pay;
  const hra           = basic * (salaryStructure.hra_percentage / 100);
  const utility       = basic * (salaryStructure.utility_percentage / 100);
  const conveyance    = basic * (salaryStructure.conveyance_percentage / 100);

  const otNormal      = attendance.overtime_normal_hours  * overtimeRate.normal_rate;
  const otHoliday     = attendance.overtime_holiday_hours * overtimeRate.holiday_rate;
  const overtimeAmt   = otNormal + otHoliday;

  const rigBonus1     = attendance.rig_bonus_days_1 * rigBonusRate.rate_usd_1
                        * rigBonusRate.usd_conv_rate;
  const rigBonus2     = attendance.rig_bonus_days_2 * rigBonusRate.rate_usd_2
                        * rigBonusRate.usd_conv_rate;
  const rigBonusAmt   = rigBonus1 + rigBonus2;

  const travelAmt     = attendance.travelling_days * travellingRate.daily_rate
                        * travellingRate.conv_rate;

  const gross = basic + hra + utility + conveyance
              + overtimeAmt + rigBonusAmt + travelAmt
              + attendance.annual_bonus
              + attendance.arrears
              + attendance.reimbursement
              + attendance.advance_salary
              + attendance.meal_allowance;

  return {
    basic_pay:            basic,
    house_rent_allowance: hra,
    utility_allowance:    utility,
    conveyance_allowance: conveyance,
    overtime_amount:      overtimeAmt,
    rig_bonus_amount:     rigBonusAmt,
    travelling_amount:    travelAmt,
    annual_bonus:         attendance.annual_bonus,
    arrears:              attendance.arrears,
    reimbursement:        attendance.reimbursement,
    advance_salary:       attendance.advance_salary,
    meal_allowance:       attendance.meal_allowance,
    gross_salary:         gross
  };
}

// Calculate income tax based on FBR tax slabs
async function calculateTax(annualGross, taxSlabs) {
  const slab = taxSlabs.find(s =>
    annualGross >= s.min_income &&
    (s.max_income === null || annualGross <= s.max_income)
  );
  if (!slab) return 0;
  const annualTax = slab.fixed_tax +
    ((annualGross - slab.min_income) * slab.tax_rate / 100);
  return annualTax / 12; // monthly tax
}

// Calculate all deductions
async function calculateDeductions(employee, salaryStructure,
                                    attendance, gross, taxSlabs) {
  const perDayRate    = salaryStructure.per_day_rate;
  const absentDed     = attendance.absent_days * perDayRate;
  const lwpDed        = attendance.leave_without_pay * perDayRate;
  const eobi          = employee.eobi_applicable ? 320 : 0;
  const annualGross   = gross * 12;
  const tax           = await calculateTax(annualGross, taxSlabs);
  const pf            = employee.pf_member
                        ? salaryStructure.basic_pay * 0.0833 : 0;

  const totalDed = eobi + tax + pf
                 + attendance.loan_deduction
                 + attendance.pf_loan
                 + absentDed + lwpDed
                 + attendance.other_deductions;

  return {
    eobi, income_tax: tax,
    provident_fund:   pf,
    absent_deduction: absentDed,
    lwp_deduction:    lwpDed,
    total_deductions: totalDed
  };
}

module.exports = { calculateGross, calculateDeductions, calculateTax };
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/departments | All departments |
| GET | /api/employees | All employees (with dept name) |
| GET | /api/employees/:id | Single employee full details |
| POST | /api/employees | Create employee |
| PUT | /api/employees/:id | Update employee |
| DELETE | /api/employees/:id | Soft delete |
| GET | /api/salary-structures/:employeeId | Get salary structure |
| POST | /api/salary-structures | Create salary structure |
| PUT | /api/salary-structures/:id | Update salary structure |
| GET | /api/attendance/:month/:year | All attendance for month |
| POST | /api/attendance | Save attendance |
| POST | /api/payroll/run/:month/:year | Run payroll calculation |
| GET | /api/payroll/:month/:year | Get payroll results |
| POST | /api/payslips/generate/:month/:year | Generate PDFs |
| GET | /api/payslips/:employeeId/:month/:year | Get payslip |
| POST | /api/approvals/submit/:month/:year | Submit for CFO approval |
| POST | /api/approvals/approve/:month/:year | CFO approves |
| POST | /api/approvals/reject/:month/:year | CFO rejects |
| GET | /api/reports/monthly/:month/:year | Monthly summary |
| GET | /api/reports/jv/:month/:year | JV entries |
| GET | /api/reports/bank-transfers/:month/:year | Bank transfer list |
| GET | /api/reports/pf-eobi/:month/:year | PF/EOBI report |

---

## VERIFICATION CHECKLIST

- [ ] All routes working — test in browser or Postman
- [ ] Payroll calculation logic tested with sample data
- [ ] Error handling working — bad input returns clear error
- [ ] All endpoints return standard response format
- [ ] localhost:5000/api/departments returns data

---

## NEXT STEP

Report back with confirmation.
Permission will be given for:
**phases/04-auth.md**

DO NOT proceed without permission.
