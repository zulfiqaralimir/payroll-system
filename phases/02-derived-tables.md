# Phase 02 — Derived Tables (7 Tables)
> WellServe HR Payroll System
> Only start this phase after Phase 01 is complete and confirmed.

---

## TABLE 1 — monthly_attendance
> Source: Excel Sheet 5 (Monthly_Input)

```sql
CREATE TABLE monthly_attendance (
  id                    SERIAL PRIMARY KEY,
  employee_id           INT           REFERENCES employees(id),
  month                 INT           NOT NULL CHECK (month BETWEEN 1 AND 12),
  year                  INT           NOT NULL,
  absent_days           NUMERIC(5,2)  DEFAULT 0,
  late_coming_hours     NUMERIC(5,2)  DEFAULT 0,
  leave_without_pay     NUMERIC(5,2)  DEFAULT 0,
  overtime_normal_hours NUMERIC(8,2)  DEFAULT 0,
  overtime_holiday_hours NUMERIC(8,2) DEFAULT 0,
  rig_bonus_days_1      NUMERIC(5,2)  DEFAULT 0,
  rig_bonus_days_2      NUMERIC(5,2)  DEFAULT 0,
  travelling_days       NUMERIC(5,2)  DEFAULT 0,
  advance_salary        NUMERIC(12,2) DEFAULT 0,
  meal_allowance        NUMERIC(12,2) DEFAULT 0,
  arrears               NUMERIC(12,2) DEFAULT 0,
  reimbursement         NUMERIC(12,2) DEFAULT 0,
  tax_adjustment        NUMERIC(12,2) DEFAULT 0,
  annual_bonus          NUMERIC(12,2) DEFAULT 0,
  loan_deduction        NUMERIC(12,2) DEFAULT 0,
  pf_loan               NUMERIC(12,2) DEFAULT 0,
  other_deductions      NUMERIC(12,2) DEFAULT 0,
  created_at            TIMESTAMP     DEFAULT NOW(),
  updated_at            TIMESTAMP     DEFAULT NOW(),
  UNIQUE (employee_id, month, year)
);
```

---

## TABLE 2 — monthly_deductions
> Calculated by system from master tables + attendance

```sql
CREATE TABLE monthly_deductions (
  id               SERIAL PRIMARY KEY,
  employee_id      INT           REFERENCES employees(id),
  month            INT           NOT NULL,
  year             INT           NOT NULL,
  eobi             NUMERIC(12,2) DEFAULT 320,
  income_tax       NUMERIC(12,2) DEFAULT 0,
  provident_fund   NUMERIC(12,2) DEFAULT 0,
  loan_deduction   NUMERIC(12,2) DEFAULT 0,
  pf_loan          NUMERIC(12,2) DEFAULT 0,
  other_deductions NUMERIC(12,2) DEFAULT 0,
  total_deductions NUMERIC(12,2) DEFAULT 0,
  created_at       TIMESTAMP     DEFAULT NOW(),
  updated_at       TIMESTAMP     DEFAULT NOW(),
  UNIQUE (employee_id, month, year)
);
```

---

## TABLE 3 — payroll_runs
> Main payroll calculation table — system calculates automatically

```sql
CREATE TABLE payroll_runs (
  id                      SERIAL PRIMARY KEY,
  employee_id             INT           REFERENCES employees(id),
  month                   INT           NOT NULL,
  year                    INT           NOT NULL,
  basic_pay               NUMERIC(12,2) DEFAULT 0,
  house_rent_allowance    NUMERIC(12,2) DEFAULT 0,
  utility_allowance       NUMERIC(12,2) DEFAULT 0,
  conveyance_allowance    NUMERIC(12,2) DEFAULT 0,
  overtime_amount         NUMERIC(12,2) DEFAULT 0,
  rig_bonus_amount        NUMERIC(12,2) DEFAULT 0,
  travelling_amount       NUMERIC(12,2) DEFAULT 0,
  annual_bonus            NUMERIC(12,2) DEFAULT 0,
  arrears                 NUMERIC(12,2) DEFAULT 0,
  reimbursement           NUMERIC(12,2) DEFAULT 0,
  advance_salary          NUMERIC(12,2) DEFAULT 0,
  meal_allowance          NUMERIC(12,2) DEFAULT 0,
  gross_salary            NUMERIC(12,2) DEFAULT 0,
  eobi                    NUMERIC(12,2) DEFAULT 0,
  income_tax              NUMERIC(12,2) DEFAULT 0,
  provident_fund          NUMERIC(12,2) DEFAULT 0,
  loan_deduction          NUMERIC(12,2) DEFAULT 0,
  pf_loan                 NUMERIC(12,2) DEFAULT 0,
  other_deductions        NUMERIC(12,2) DEFAULT 0,
  absent_deduction        NUMERIC(12,2) DEFAULT 0,
  lwp_deduction           NUMERIC(12,2) DEFAULT 0,
  total_deductions        NUMERIC(12,2) DEFAULT 0,
  net_salary              NUMERIC(12,2) DEFAULT 0,
  status                  VARCHAR(20)   DEFAULT 'draft'
                          CHECK (status IN
                            ('draft','submitted','approved','rejected','paid')),
  created_at              TIMESTAMP     DEFAULT NOW(),
  updated_at              TIMESTAMP     DEFAULT NOW(),
  UNIQUE (employee_id, month, year)
);
```

---

## TABLE 4 — payslips

```sql
CREATE TABLE payslips (
  id           SERIAL PRIMARY KEY,
  employee_id  INT          REFERENCES employees(id),
  payroll_id   INT          REFERENCES payroll_runs(id),
  month        INT          NOT NULL,
  year         INT          NOT NULL,
  pdf_path     VARCHAR(500),
  generated_at TIMESTAMP    DEFAULT NOW(),
  emailed      BOOLEAN      DEFAULT false,
  emailed_at   TIMESTAMP,
  UNIQUE (employee_id, month, year)
);
```

---

## TABLE 5 — bank_transfers

```sql
CREATE TABLE bank_transfers (
  id           SERIAL PRIMARY KEY,
  payroll_id   INT           REFERENCES payroll_runs(id),
  employee_id  INT           REFERENCES employees(id),
  bank_id      INT           REFERENCES banks(id),
  account_no   VARCHAR(50),
  amount       NUMERIC(12,2) DEFAULT 0,
  month        INT           NOT NULL,
  year         INT           NOT NULL,
  transfer_mode VARCHAR(10)  DEFAULT 'bank'
               CHECK (transfer_mode IN ('bank','cash')),
  status       VARCHAR(20)   DEFAULT 'pending'
               CHECK (status IN ('pending','processed','failed')),
  created_at   TIMESTAMP     DEFAULT NOW()
);
```

---

## TABLE 6 — pf_eobi_report

```sql
CREATE TABLE pf_eobi_report (
  id                    SERIAL PRIMARY KEY,
  employee_id           INT           REFERENCES employees(id),
  pf_scheme_id          INT           REFERENCES pf_schemes(id),
  month                 INT           NOT NULL,
  year                  INT           NOT NULL,
  pf_employee_share     NUMERIC(12,2) DEFAULT 0,
  pf_employer_share     NUMERIC(12,2) DEFAULT 0,
  pf_loan_deduction     NUMERIC(12,2) DEFAULT 0,
  pf_total              NUMERIC(12,2) DEFAULT 0,
  eobi_employee_share   NUMERIC(12,2) DEFAULT 320,
  eobi_employer_share   NUMERIC(12,2) DEFAULT 1600,
  eobi_total            NUMERIC(12,2) DEFAULT 1920,
  created_at            TIMESTAMP     DEFAULT NOW(),
  UNIQUE (employee_id, month, year)
);
```

---

## TABLE 7 — jv_entries
> Journal Voucher — accounting entries per department per month

```sql
CREATE TABLE jv_entries (
  id              SERIAL PRIMARY KEY,
  month           INT           NOT NULL,
  year            INT           NOT NULL,
  department_id   INT           REFERENCES departments(id),
  account_code_id INT           REFERENCES account_codes(id),
  account_code    VARCHAR(20),
  account_name    VARCHAR(255),
  debit_amount    NUMERIC(12,2) DEFAULT 0,
  credit_amount   NUMERIC(12,2) DEFAULT 0,
  description     TEXT,
  transaction_no  INT           CHECK (transaction_no IN (1,2,3)),
  created_at      TIMESTAMP     DEFAULT NOW()
);
```

---

## EXTRA TABLE — users
> System users — for authentication

```sql
CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(100) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,
  role         VARCHAR(20)  DEFAULT 'hr_manager'
               CHECK (role IN ('admin','hr_manager','cfo')),
  is_active    BOOLEAN      DEFAULT true,
  last_login   TIMESTAMP,
  created_at   TIMESTAMP    DEFAULT NOW(),
  updated_at   TIMESTAMP    DEFAULT NOW()
);

-- Seed default admin user (password will be set on first login)
INSERT INTO users (name, email, password, role) VALUES
  ('System Admin', 'admin@wellserve.com',
   '$2b$10$placeholder_hash_change_on_first_login', 'admin'),
  ('Muhammad Faizan', 'faizan@wellserve.com',
   '$2b$10$placeholder_hash_change_on_first_login', 'cfo');
```

---

## EXTRA TABLE — audit_log
> Tracks every action by every user

```sql
CREATE TABLE audit_log (
  id           SERIAL PRIMARY KEY,
  user_id      INT          REFERENCES users(id),
  action       VARCHAR(100) NOT NULL,
  table_name   VARCHAR(100),
  record_id    INT,
  old_values   JSONB,
  new_values   JSONB,
  ip_address   VARCHAR(50),
  performed_at TIMESTAMP    DEFAULT NOW()
);
```

---

## ADD API ROUTES for derived tables

Add to backend/server.js:

```javascript
app.use('/api/attendance',      require('./routes/attendance'));
app.use('/api/deductions',      require('./routes/deductions'));
app.use('/api/payroll',         require('./routes/payroll'));
app.use('/api/payslips',        require('./routes/payslips'));
app.use('/api/bank-transfers',  require('./routes/bankTransfers'));
app.use('/api/pf-eobi',         require('./routes/pfEobi'));
app.use('/api/jv-entries',      require('./routes/jvEntries'));
app.use('/api/users',           require('./routes/users'));
app.use('/api/audit-log',       require('./routes/auditLog'));
```

---

## UPDATE FRONTEND

Add new tabs to the dashboard:

```
[ Monthly Attendance ] [ Deductions ] [ Payroll Runs ]
[ Payslips ] [ Bank Transfers ] [ PF/EOBI ] [ JV Entries ]
[ Users ] [ Audit Log ]
```

---

## VERIFICATION CHECKLIST

- [ ] All 7 derived tables created
- [ ] users table created with 2 default users
- [ ] audit_log table created
- [ ] All API routes working
- [ ] Frontend shows all derived table tabs
- [ ] localhost:3000 shows complete database viewer

---

## NEXT STEP

Report back with confirmation.
Permission will be given for:
**phases/03-backend.md**

DO NOT proceed without permission.
