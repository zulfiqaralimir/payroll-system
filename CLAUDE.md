# CLAUDE.md — WellServe HR Payroll System
> Developer: Zulfiqar Ali Mir — Black Iron Quantum AI (Private) Limited
> Client: WellServe Oilfield Services (Pvt) Ltd, Islamabad
> CFO: Muhammad Faizan | Address: Plot 5-J & 5-K, Street 1, I-10/3, Islamabad

---

## Project Overview

Build a full HR Payroll Management System for WellServe Oilfield Services.
- 190+ employees across 15 departments
- Two staff types: Admin Staff and Direct (Field) Staff
- Monthly salary processing, payslip generation, tax, EOBI, Provident Fund
- Excel-based data input with automatic folder watching
- CFO approval workflow
- Journal Voucher (JV) generation for accounting
- Bank transfer lists (FBL, HMB, Cash)

---

## How Data Entry Works

### Input Excel File
HR maintains one Excel file: WellServe-HR-Data.xlsx
This file has 5 sheets:

| Sheet | Name | Fill When |
|-------|------|-----------|
| 1 | Employees | Once — when new employee joins |
| 2 | Salary_Rates | Once — when salary changes |
| 3 | Overtime_Rates | Once — when rate changes |
| 4 | Rig_Bonus_Rates | Once — when rate changes |
| 5 | Monthly_Input | Every month — attendance, OT, absences |

### Folder Watching
- HR saves WellServe-HR-Data.xlsx in a watched folder
- System detects the file automatically using chokidar
- System asks HR: "New file detected. Import now?"
- HR clicks YES → system reads all sheets → updates database
- Sheet 1-4 update master tables
- Sheet 5 updates monthly input data

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| Excel Reader | SheetJS (xlsx) |
| Folder Watcher | chokidar |
| PDF Generator | Puppeteer |
| Authentication | JWT |
| Hosting | On-premise / VPS |

---

## Project Folder Structure

```
wellserve-payroll/
├── CLAUDE.md                  ← This file
├── phases/                    ← Phase instruction files
│   ├── 01-master-tables.md
│   ├── 02-derived-tables.md
│   ├── 03-backend.md
│   ├── 04-auth.md
│   ├── 05-excel-watcher.md
│   ├── 06-employees.md
│   ├── 07-payroll.md
│   ├── 08-payslips.md
│   ├── 09-approvals.md
│   ├── 10-reports.md
│   └── 11-frontend.md
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── .env
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── watcher.js
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       └── services/
├── database/
│   ├── master-tables.sql
│   └── derived-tables.sql
└── excel-input/               ← Watched folder for Excel files
```

---

## Database Overview

### Master Tables (10) — fed by Excel input
| # | Table | Source |
|---|-------|--------|
| 1 | departments | Seeded — 15 WellServe departments |
| 2 | employees | Excel Sheet 1 |
| 3 | salary_structures | Excel Sheet 2 |
| 4 | overtime_rates | Excel Sheet 3 |
| 5 | rig_bonus_rates | Excel Sheet 4 |
| 6 | travelling_rates | Excel Sheet 4 |
| 7 | tax_slabs | Admin entry — FBR rates |
| 8 | account_codes | Admin entry — GL codes from JV sheet |
| 9 | banks | Admin entry — FBL, HMB, Cash |
| 10 | pf_schemes | Admin entry — VPS, MCB, WellServe PF |

### Derived Tables (7) — calculated by system
| # | Table | Derived From |
|---|-------|--------------|
| 1 | monthly_attendance | Excel Sheet 5 |
| 2 | monthly_deductions | master tables + tax_slabs |
| 3 | payroll_runs | all master + attendance |
| 4 | payslips | payroll_runs |
| 5 | bank_transfers | payroll_runs + banks |
| 6 | pf_eobi_report | payroll_runs + pf_schemes |
| 7 | jv_entries | payroll_runs + account_codes |

---

## WellServe Departments (15)

### Admin Staff (6)
1. Management
2. Business Development
3. QHSE
4. Finance
5. HR & Admin
6. IT

### Direct Staff (9)
7. Fishing
8. Coring
9. Rental
10. Pressure Control
11. Machine Shop
12. Maintenance
13. QC Lab
14. Procurement & Stores
15. TRS

---

## Salary Calculation Formula

### Gross Salary
```
Gross = Basic Pay
      + House Rent Allowance  (40% of Basic)
      + Utility Allowance     (5% of Basic)
      + Conveyance Allowance  (5% of Basic)
      + Overtime Amount       (Hours × Hourly Rate)
      + Rig Bonus             (Days × Rate × USD conversion)
      + Travelling Amount     (Days × Rate × conversion)
      + Annual Bonus          (~50% of Basic)
      + Arrears
      + Reimbursement/Adjustment
      + Advance Against Salary
```

### Total Deductions
```
Deductions = EOBI               (PKR 320 fixed per employee)
           + Income Tax          (per FBR tax slabs)
           + Provident Fund      (% of Basic)
           + Loan Deduction
           + PF Loan Deduction
           + Absent Days         (Days × Per Day Rate)
           + Leave Without Pay
           + Other Deductions
```

### Net Salary
```
Net Salary = Gross Salary - Total Deductions
```

---

## User Roles

| Role | Access |
|------|--------|
| admin | Full access, user management, settings |
| hr_manager | Employee data, run payroll, generate payslips |
| cfo | View and approve payroll, all reports |

---

## Important Coding Rules

1. ALWAYS read the current phase file before writing any code
2. ALWAYS show result on localhost before proceeding
3. NEVER proceed to next phase without explicit user confirmation
4. NEVER hard delete any record — always soft delete (is_active = false)
5. Currency format: PKR with comma separator e.g. 51,297
6. Date format: Pakistan timezone PKT (UTC+5)
7. CNIC format validation: 00000-0000000-0
8. Employee ID format: ITS-001, ITS-002 etc.
9. All financial calculations must use NUMERIC(12,2) in PostgreSQL
10. Every action must be logged in audit_log table

---

## Phase Execution Order

Execute phases in this exact order.
Read the phase file. Build it. Show on localhost. Wait for permission.

| Phase | File | Description |
|-------|------|-------------|
| 1 | phases/01-master-tables.md | All 10 master tables + seed data |
| 2 | phases/02-derived-tables.md | All 7 derived tables |
| 3 | phases/03-backend.md | Node.js server + all API routes |
| 4 | phases/04-auth.md | Login + JWT + role-based access |
| 5 | phases/05-excel-watcher.md | Excel folder watcher + import |
| 6 | phases/06-employees.md | Employee management module |
| 7 | phases/07-payroll.md | Monthly payroll calculation |
| 8 | phases/08-payslips.md | PDF payslip generation |
| 9 | phases/09-approvals.md | CFO approval workflow |
| 10 | phases/10-reports.md | Reports + dashboard |
| 11 | phases/11-frontend.md | Complete React UI |

---

## START HERE

Read phases/01-master-tables.md and begin Phase 1.
Do not proceed further until Phase 1 is complete and confirmed.
