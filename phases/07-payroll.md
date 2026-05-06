# Phase 07 — Monthly Payroll Calculation
> Only start after Phase 06 is complete and confirmed.

---

## GOAL
Build the monthly payroll run engine and UI.

---

## Payroll Run Flow

```
HR selects Month + Year
        ↓
Clicks "Run Payroll"
        ↓
System fetches for EACH employee:
  - Salary structure
  - Overtime rates
  - Rig bonus rates
  - Travelling rates
  - Monthly attendance (from Sheet 5)
        ↓
Calculates:
  Gross = Basic + HRA + Utility + Conveyance
        + Overtime + Rig Bonus + Travelling
        + Annual Bonus + Arrears + Reimbursement

  Deductions = EOBI + Tax + PF + Loans
             + Absent Deduction + LWP

  Net = Gross - Deductions
        ↓
Saves results in payroll_runs table
Status = 'draft'
        ↓
Shows payroll summary to HR
```

---

## Pages to build

### 1. Run Payroll Page (localhost:3000/payroll/run)
- Month selector + Year selector
- "Run Payroll" button
- Progress bar while calculating
- Summary after run:
  - Total employees processed
  - Total gross salary (PKR format)
  - Total deductions
  - Total net salary
  - Errors if any employee failed

### 2. Payroll Review Page (localhost:3000/payroll/:month/:year)
- Table of all employees with their calculated salary
- Columns: Name, Department, Gross, Deductions, Net, Status
- Filter by department
- Summary totals at bottom
- "Submit for Approval" button

### 3. Employee Payroll Detail
- Shows full breakdown for one employee
- Matches exactly the WellServe payslip format

---

## VERIFICATION CHECKLIST
- [ ] Run Payroll calculates correctly for all employees
- [ ] Gross salary matches WellServe Excel sample data
- [ ] Net salary matches WellServe Excel sample data
- [ ] All 15 departments show in payroll summary
- [ ] Submit for Approval button works
- [ ] localhost:3000/payroll/run loads correctly

---

## NEXT STEP
Report back. Permission will be given for: phases/08-payslips.md
DO NOT proceed without permission.
