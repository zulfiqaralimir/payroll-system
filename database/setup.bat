@ECHO OFF
REM WellServe Payroll — Database Setup Script
REM Run this once to create the database and all master tables

SET PATH=F:\DataBase\bin;%PATH%
SET PGDATA=F:\DataBase\data

ECHO =============================================
ECHO  WellServe HR Payroll — Database Setup
ECHO =============================================
ECHO.

SET /P PGPASSWORD=Enter PostgreSQL postgres password:
SET PGPASSWORD=%PGPASSWORD%

ECHO.
ECHO Creating database wellserve_payroll...
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE wellserve_payroll;" 2>NUL
IF %ERRORLEVEL%==0 (
  ECHO Database created successfully.
) ELSE (
  ECHO Database may already exist, continuing...
)

ECHO.
ECHO Creating master tables and seeding data...
psql -U postgres -h localhost -p 5432 -d wellserve_payroll -f "%~dp0master-tables.sql"
IF %ERRORLEVEL%==0 (
  ECHO Master tables created and seeded successfully!
) ELSE (
  ECHO ERROR: Failed to create tables. Check the error above.
  PAUSE
  EXIT /B 1
)

ECHO.
ECHO =============================================
ECHO  Setup Complete!
ECHO  - Database: wellserve_payroll
ECHO  - 10 master tables created
ECHO  - Departments, Tax Slabs, Banks, PF Schemes seeded
ECHO =============================================
PAUSE
