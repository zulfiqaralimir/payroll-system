# Phase 06 — Employee Management Module
> Only start after Phase 05 is complete and confirmed.

---

## GOAL
Build complete employee management UI with full CRUD operations.

---

## Pages to build

### 1. Employee List Page (localhost:3000/employees)
- Search bar (by name, CNIC, employee ID)
- Filter by: Department, Staff Type, Employment Type, Status
- Table columns: ID, Name, Designation, Department, Bank, Status
- Actions: View, Edit, Deactivate
- Export to Excel button
- Total count: "190 Employees | 6 Admin | 184 Direct"

### 2. Employee Detail Page (localhost:3000/employees/:id)
Shows full employee profile with tabs:
- Tab 1: Personal Info (name, CNIC, father/mother name, joining date)
- Tab 2: Salary Structure (basic pay, allowances, rates)
- Tab 3: Overtime & Rig Rates
- Tab 4: Monthly History (list of past payroll months)

### 3. Add/Edit Employee Form
- All fields from employees table
- Department dropdown (shows all 15 departments)
- Employment type dropdown
- Bank dropdown (FBL, HMB, Cash)
- Validation on all fields
- CNIC format: 00000-0000000-0

---

## VERIFICATION CHECKLIST
- [ ] Employee list shows all employees from database
- [ ] Search and filter work correctly
- [ ] Add new employee works
- [ ] Edit employee works
- [ ] View full employee profile works
- [ ] localhost:3000/employees loads correctly

---

## NEXT STEP
Report back. Permission will be given for: phases/07-payroll.md
DO NOT proceed without permission.
