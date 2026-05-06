-- WellServe HR Payroll System — Master Tables
-- Phase 01
-- Run as: psql -U postgres -d wellserve_payroll -f master-tables.sql

-- ============================================================
-- TABLE 1: departments
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  staff_type  VARCHAR(10)  NOT NULL CHECK (staff_type IN ('direct', 'admin')),
  description TEXT,
  is_active   BOOLEAN      DEFAULT true,
  created_at  TIMESTAMP    DEFAULT NOW(),
  updated_at  TIMESTAMP    DEFAULT NOW()
);

INSERT INTO departments (name, staff_type) VALUES
  ('Management',           'admin'),
  ('Business Development', 'admin'),
  ('QHSE',                 'admin'),
  ('Finance',              'admin'),
  ('HR & Admin',           'admin'),
  ('IT',                   'admin'),
  ('Fishing',              'direct'),
  ('Coring',               'direct'),
  ('Rental',               'direct'),
  ('Pressure Control',     'direct'),
  ('Machine Shop',         'direct'),
  ('Maintenance',          'direct'),
  ('QC Lab',               'direct'),
  ('Procurement & Stores', 'direct'),
  ('TRS',                  'direct')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- TABLE 2: employees
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id                SERIAL PRIMARY KEY,
  employee_id       VARCHAR(20)  UNIQUE,
  name              VARCHAR(100) NOT NULL,
  designation       VARCHAR(100),
  department_id     INT          REFERENCES departments(id),
  cnic              VARCHAR(20)  UNIQUE,
  father_name       VARCHAR(100),
  mother_name       VARCHAR(100),
  date_of_joining   DATE,
  employment_type   VARCHAR(20)  DEFAULT 'permanent'
                    CHECK (employment_type IN ('permanent','contract','trainee')),
  bank_name         VARCHAR(50),
  bank_account      VARCHAR(50),
  mode_of_payment   VARCHAR(20)  DEFAULT 'bank'
                    CHECK (mode_of_payment IN ('bank','cash')),
  pf_member         BOOLEAN      DEFAULT false,
  eobi_applicable   BOOLEAN      DEFAULT true,
  is_active         BOOLEAN      DEFAULT true,
  created_at        TIMESTAMP    DEFAULT NOW(),
  updated_at        TIMESTAMP    DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: salary_structures
-- ============================================================
CREATE TABLE IF NOT EXISTS salary_structures (
  id                    SERIAL PRIMARY KEY,
  employee_id           INT          REFERENCES employees(id) UNIQUE,
  basic_pay             NUMERIC(12,2) DEFAULT 0,
  hra_percentage        NUMERIC(5,2)  DEFAULT 40,
  utility_percentage    NUMERIC(5,2)  DEFAULT 5,
  conveyance_percentage NUMERIC(5,2)  DEFAULT 5,
  per_day_rate          NUMERIC(12,2) DEFAULT 0,
  hourly_rate           NUMERIC(12,2) DEFAULT 0,
  effective_date        DATE          DEFAULT CURRENT_DATE,
  is_active             BOOLEAN       DEFAULT true,
  created_at            TIMESTAMP     DEFAULT NOW(),
  updated_at            TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: overtime_rates
-- ============================================================
CREATE TABLE IF NOT EXISTS overtime_rates (
  id             SERIAL PRIMARY KEY,
  employee_id    INT           REFERENCES employees(id) UNIQUE,
  normal_rate    NUMERIC(12,2) DEFAULT 0,
  holiday_rate   NUMERIC(12,2) DEFAULT 0,
  effective_date DATE          DEFAULT CURRENT_DATE,
  is_active      BOOLEAN       DEFAULT true,
  created_at     TIMESTAMP     DEFAULT NOW(),
  updated_at     TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: rig_bonus_rates
-- ============================================================
CREATE TABLE IF NOT EXISTS rig_bonus_rates (
  id             SERIAL PRIMARY KEY,
  employee_id    INT           REFERENCES employees(id) UNIQUE,
  rate_usd_1     NUMERIC(10,2) DEFAULT 0,
  rate_usd_2     NUMERIC(10,2) DEFAULT 0,
  usd_conv_rate  NUMERIC(10,2) DEFAULT 278,
  effective_date DATE          DEFAULT CURRENT_DATE,
  is_active      BOOLEAN       DEFAULT true,
  created_at     TIMESTAMP     DEFAULT NOW(),
  updated_at     TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 6: travelling_rates
-- ============================================================
CREATE TABLE IF NOT EXISTS travelling_rates (
  id             SERIAL PRIMARY KEY,
  employee_id    INT           REFERENCES employees(id) UNIQUE,
  daily_rate     NUMERIC(10,2) DEFAULT 1500,
  conv_rate      NUMERIC(10,2) DEFAULT 1,
  effective_date DATE          DEFAULT CURRENT_DATE,
  is_active      BOOLEAN       DEFAULT true,
  created_at     TIMESTAMP     DEFAULT NOW(),
  updated_at     TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 7: tax_slabs
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_slabs (
  id          SERIAL PRIMARY KEY,
  tax_year    INT           NOT NULL,
  min_income  NUMERIC(12,2) NOT NULL,
  max_income  NUMERIC(12,2),
  tax_rate    NUMERIC(5,2)  DEFAULT 0,
  fixed_tax   NUMERIC(12,2) DEFAULT 0,
  description VARCHAR(255),
  is_active   BOOLEAN       DEFAULT true,
  created_at  TIMESTAMP     DEFAULT NOW()
);

INSERT INTO tax_slabs (tax_year, min_income, max_income, tax_rate, fixed_tax, description) VALUES
  (2025, 0,        600000,   0,    0,       'Up to 600,000 — exempt'),
  (2025, 600001,   1200000,  5,    0,       '600,001 to 1,200,000'),
  (2025, 1200001,  2400000,  15,   30000,   '1,200,001 to 2,400,000'),
  (2025, 2400001,  3600000,  25,   210000,  '2,400,001 to 3,600,000'),
  (2025, 3600001,  6000000,  30,   510000,  '3,600,001 to 6,000,000'),
  (2025, 6000001,  NULL,     35,   1230000, 'Above 6,000,000');

-- ============================================================
-- TABLE 8: account_codes
-- ============================================================
CREATE TABLE IF NOT EXISTS account_codes (
  id            SERIAL PRIMARY KEY,
  department_id INT          REFERENCES departments(id),
  account_code  VARCHAR(20)  NOT NULL,
  account_name  VARCHAR(255) NOT NULL,
  entry_type    VARCHAR(10)  CHECK (entry_type IN ('debit','credit')),
  category      VARCHAR(50),
  is_active     BOOLEAN      DEFAULT true,
  created_at    TIMESTAMP    DEFAULT NOW()
);

INSERT INTO account_codes (department_id, account_code, account_name, entry_type, category) VALUES
  (7,    '2615', 'Direct Wages - BHA',           'debit',  'salary'),
  (15,   '2616', 'Direct Wages - TRS',            'debit',  'salary'),
  (7,    '2617', 'Direct Wages - Fishing',        'debit',  'salary'),
  (9,    '2618', 'Direct Wages - Casing Running', 'debit',  'salary'),
  (11,   '2619', 'Direct Wages - Machine Shop',   'debit',  'salary'),
  (10,   '2621', 'Direct Wages - Pressure Ctrl',  'debit',  'salary'),
  (8,    '2622', 'Direct Wages - Coring',         'debit',  'salary'),
  (9,    '2631', 'Overtime - BHA',                'debit',  'overtime'),
  (15,   '2632', 'Overtime - TRS',                'debit',  'overtime'),
  (7,    '2633', 'Overtime - Fishing',            'debit',  'overtime'),
  (15,   '2651', 'Rig Bonus - TRS',               'debit',  'rig_bonus'),
  (7,    '2652', 'Rig Bonus - Fishing',           'debit',  'rig_bonus'),
  (1,    '4000', 'Salary - Admin',                'debit',  'salary'),
  (1,    '4002', 'Overtime - Admin',              'debit',  'overtime'),
  (1,    '4013', 'Bonus - Admin Staff',           'debit',  'bonus'),
  (NULL, '8024', 'EOBI Payable',                  'credit', 'liability'),
  (NULL, '8035', 'WHT Payable',                   'credit', 'liability'),
  (NULL, '8031', 'Provident Fund Payable',        'credit', 'liability'),
  (NULL, '7310', 'Employee Advance',              'credit', 'liability'),
  (NULL, '8030', 'Net Salary Payable',            'credit', 'liability');

-- ============================================================
-- TABLE 9: banks
-- ============================================================
CREATE TABLE IF NOT EXISTS banks (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  short_name VARCHAR(20)  NOT NULL UNIQUE,
  account_no VARCHAR(50),
  branch     VARCHAR(100),
  is_active  BOOLEAN      DEFAULT true,
  created_at TIMESTAMP    DEFAULT NOW()
);

INSERT INTO banks (name, short_name, account_no, branch) VALUES
  ('Faysal Bank Limited',     'FBL',  '3602390000001569',        'Islamabad'),
  ('Habib Metropolitan Bank', 'HMB',  '6-02-68-20311-714-147984','I-10 Branch Islamabad'),
  ('Cash Payment',            'Cash', NULL,                       NULL)
ON CONFLICT (short_name) DO NOTHING;

-- ============================================================
-- TABLE 10: pf_schemes
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_schemes (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  short_name    VARCHAR(50),
  employee_rate NUMERIC(5,2) DEFAULT 0,
  employer_rate NUMERIC(5,2) DEFAULT 0,
  scheme_type   VARCHAR(20)  CHECK (scheme_type IN ('pf','vps')),
  trustee       VARCHAR(255),
  is_active     BOOLEAN      DEFAULT true,
  created_at    TIMESTAMP    DEFAULT NOW()
);

INSERT INTO pf_schemes (name, short_name, scheme_type, trustee) VALUES
  ('Wellserve Employees Contributory Provident Fund', 'WS-PF',    'pf',  'Wellserve'),
  ('CDC Trustee NAFA Islamic Pension Fund',           'NAFA-VPS', 'vps', 'CDC Trustee'),
  ('CDC Trustee Alhamra Islamic Pension Fund',        'MCB-VPS',  'vps', 'CDC Trustee');
