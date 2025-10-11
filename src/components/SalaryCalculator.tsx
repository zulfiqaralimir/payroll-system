'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Employee, Attendance } from '@/app/page';
import PayslipGenerator from './PayslipGenerator';
import TaxCertificate from './TaxCertificate';

interface SalarySlip {
  employee_id: string;
  name: string;
  presentDays: number;
  absentDays: number;
  grossSalary: number;
  deduction: number;
  overtimeAmount: number;
  tax: number;
  netSalary: number;
}

interface SalaryCalculatorProps {
  employees: Employee[];
  attendance: Attendance[];
}

export default function SalaryCalculator({ employees, attendance }: SalaryCalculatorProps) {
  const [salaries, setSalaries] = useState<SalarySlip[]>([]);

  const calculateSalary = () => {
    const salaryData: SalarySlip[] = employees.map((emp) => {
      const empAttendance = attendance.filter((a) => a.employee_id === emp.employee_id);
      const presentDays = empAttendance.filter((a) => a.status === 'Present').length;
      const absentDays = empAttendance.filter((a) => a.status === 'Absent').length;

      const basicSalary = Number(emp.basic_salary) || 0;
      const allowance = Number(emp.allowance) || 0;
      const grossSalary = basicSalary + allowance;

      const deduction = (grossSalary / 30) * absentDays;
      const overtimeAmount = (grossSalary / 30 / 8) * Math.floor(Math.random() * 10);
      const tax = grossSalary * 0.05;
      const netSalary = grossSalary - deduction + overtimeAmount - tax;

      return {
        employee_id: emp.employee_id,
        name: emp.name,
        presentDays,
        absentDays,
        grossSalary,
        deduction,
        overtimeAmount,
        tax,
        netSalary,
      };
    });

    setSalaries(salaryData);
  };

  return (
    <div className="border p-4 rounded shadow mt-10">
      <h2 className="text-lg font-bold mb-4">Salary Calculation (with Overtime & Tax)</h2>
      <Button onClick={calculateSalary}>Calculate Salary</Button>

      {salaries.map((sal, idx) => (
        <div key={idx} className="border p-4 rounded shadow mt-6">
          <p><strong>Employee:</strong> {sal.name} ({sal.employee_id})</p>
          <p><strong>Present Days:</strong> {sal.presentDays}</p>
          <p><strong>Absent Days:</strong> {sal.absentDays}</p>
          <p><strong>Overtime Earned:</strong> Rs. {Number(sal.overtimeAmount).toFixed(2)}</p>
          <p><strong>Gross Salary:</strong> Rs. {Number(sal.grossSalary).toFixed(2)}</p>
          <p><strong>Deduction (Absents):</strong> Rs. {Number(sal.deduction).toFixed(2)}</p>
          <p><strong>Tax (5%):</strong> Rs. {Number(sal.tax).toFixed(2)}</p>
          <p><strong>Net Salary:</strong> Rs. {Number(sal.netSalary).toFixed(2)}</p>

          <PayslipGenerator
            employee={{
              employee_id: sal.employee_id,
              name: sal.name,
              designation: employees.find((e) => e.employee_id === sal.employee_id)?.designation || '',
              department: employees.find((e) => e.employee_id === sal.employee_id)?.department || '',
            }}
            salary={sal}
            month="October 2025"
          />

          <TaxCertificate
            employee={{
              employee_id: sal.employee_id,
              name: sal.name,
              designation: employees.find((e) => e.employee_id === sal.employee_id)?.designation || '',
              department: employees.find((e) => e.employee_id === sal.employee_id)?.department || '',
              cnic: employees.find((e) => e.employee_id === sal.employee_id)?.cnic || '',
            }}
            salary={{
              grossSalary: sal.grossSalary,
              tax: sal.tax,
            }}
          />
        </div>
      ))}
    </div>
  );
}
