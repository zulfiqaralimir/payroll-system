@echo off
title WellServe Payroll - Starting...
color 1F

echo.
echo  ==========================================
echo   WellServe HR Payroll System v1.00
echo  ==========================================
echo.

:: Start PostgreSQL
echo  [1/3] Starting PostgreSQL...
del "F:\DataBase\data\postmaster.pid" 2>nul
"F:\DataBase\bin\pg_ctl.exe" start -D "F:\DataBase\data" -w -l "F:\DataBase\data\pg_start.log" >nul 2>&1
if %errorlevel% neq 0 (
    echo  [OK] PostgreSQL already running.
) else (
    echo  [OK] PostgreSQL started.
)

:: Wait for DB to be ready
timeout /t 3 /nobreak >nul

:: Start Next.js production server
echo  [2/3] Starting application server...
start "WellServe App" /min cmd /c "cd /d F:\P_Drive\WellServe_Payroll_v1.00\nextjs && npm run start"

:: Wait for server to be ready
echo  [3/3] Waiting for server...
timeout /t 6 /nobreak >nul

:: Open browser
echo.
echo  Opening http://localhost:3000 ...
start http://localhost:3000

echo.
echo  ==========================================
echo   WellServe Payroll is RUNNING
echo   URL: http://localhost:3000
echo  ==========================================
echo.
echo  Close the "WellServe App" window to stop.
echo.
pause
