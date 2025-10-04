'use client';

import React, { useState } from 'react';
import EmployeeForm from '@/components/EmployeeForm';
import AttendanceForm from '@/components/AttendanceForm';
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
    <main className="p-10 space-y-10">
      <h1 className="text-2xl font-bold">Payroll System</h1>

      <EmployeeForm employees={employees} setEmployees={setEmployees} />
      <AttendanceForm attendance={attendance} setAttendance={setAttendance} employees={employees} />
      <SalaryCalculator employees={employees} attendance={attendance} />
    </main>
  );
}
