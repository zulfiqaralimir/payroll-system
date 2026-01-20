'use client';

import DashboardSummary from '@/components/DashboardSummary';
import React, { useState } from 'react';
import EmployeeGrid from '@/components/EmployeeGrid';
import AttendanceGrid from '@/components/AttendanceGrid';
import SalaryCalculator from '@/components/SalaryCalculator';

export interface Employee {
  employee_id: string;
  name: string;
  father_name: string;
  cnic: string;
  date_of_joining: string;
  designation: string;
  pay_scale: string;
  department: string;
  basic_salary: string;
  allowance: string;
}

export interface Attendance {
  employee_id: string;
  date: string;
  status: 'Present' | 'Absent';
}

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Payroll System</h1>
          <p className="text-gray-600 mt-1">Excel-style interface for efficient data management</p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* Employee Master Data Section */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">📋 Employee Master Data</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add and manage employee information in spreadsheet format
            </p>
          </div>
          <EmployeeGrid employees={employees} setEmployees={setEmployees} />
        </section>

        {/* Attendance Tracking Section */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">📅 Attendance Tracking</h2>
            <p className="text-sm text-gray-600 mt-1">
              Mark daily attendance with Excel-like interface
            </p>
          </div>
          <AttendanceGrid 
            attendance={attendance} 
            setAttendance={setAttendance}
            employees={employees}
          />
        </section>

        {/* Salary Calculator Section */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">💰 Salary Calculation</h2>
            <p className="text-sm text-gray-600 mt-1">
              Calculate salaries with automatic tax and deductions
            </p>
          </div>
          <SalaryCalculator employees={employees} attendance={attendance} />
        </section>

        {/* Dashboard Section */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">📊 Dashboard Summary</h2>
            <p className="text-sm text-gray-600 mt-1">
              Overview of payroll metrics and analytics
            </p>
          </div>
          <DashboardSummary employees={employees} salaries={[]} />
        </section>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-[1600px] mx-auto px-6 py-6 text-center text-sm text-gray-600">
          <p>Payroll System - Wellserve Oilfield Services (Pvt) Ltd.</p>
          <p className="mt-1">Excel-style interface for efficient payroll management</p>
        </div>
      </div>
    </main>
  );
}
