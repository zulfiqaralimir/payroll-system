# Phase 10 — Reports + Dashboard
> Only start after Phase 09 is complete and confirmed.

---

## GOAL
Build comprehensive reports for HR and CFO.

---

## Reports to build

### 1. Main Dashboard (localhost:3000/dashboard)
Summary cards:
- Total Employees
- Total Payroll This Month (PKR)
- Pending Approvals
- Payslips Generated

Charts:
- Payroll cost by department (bar chart)
- Monthly payroll trend (line chart)

### 2. Monthly Payroll Summary Report
- All employees with salary breakdown
- Department subtotals
- Grand total
- Export: PDF + Excel

### 3. Department Cost Report
- Cost per department
- Admin vs Direct staff comparison

### 4. Bank Transfer Lists
- FBL transfer list (matches WellServe FBL sheet format)
- HMB transfer list (matches WellServe HMBL sheet format)
- Cash payment list

### 5. PF/EOBI Report
- Matches WellServe PF sheet format
- Employee share + Employer share
- Per scheme (WS-PF, NAFA-VPS, MCB-VPS)

### 6. Journal Voucher (JV) Report
- Matches WellServe JV sheet format exactly
- Transaction 1: Salary by department with GL codes
- Transaction 2: EOBI employer contribution
- Transaction 3: PF employer contribution
- Export to Excel

### 7. Tax Deduction Report
- Income tax per employee
- Annual projection
- FBR format

---

## VERIFICATION CHECKLIST
- [ ] Dashboard shows correct summary data
- [ ] All 7 reports working
- [ ] JV report matches WellServe format
- [ ] Bank transfer lists match WellServe format
- [ ] Export to PDF works
- [ ] Export to Excel works
- [ ] localhost:3000/dashboard loads correctly

---

## NEXT STEP
Report back. Permission will be given for: phases/11-frontend.md
DO NOT proceed without permission.
