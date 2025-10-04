'use client';


import PayslipGenerator from './PayslipGenerator';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Employee, Attendance } from '@/app/page';
import TaxCertificate from './TaxCertificate';


interface Props {
  employees: Employee[];
  attendance: Attendance[];
}

export default function SalaryCalculator({ employees, attendance }: Props) {
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

const [salaries, setSalaries] = useState<SalarySlip[]>([]);

  const [overtimeHours, setOvertimeHours] = useState<Record<string, number>>({});

  const handleOvertimeChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    setOvertimeHours({ ...overtimeHours, [id]: parseFloat(e.target.value || '0') });
  };

  const calculate = () => {
    const daysInMonth = 30;
    const taxRate = 0.05;
    const overtimeMultiplier = 1.5;

    const slips = employees.map((emp) => {
      const records = attendance.filter((r) => r.employee_id === emp.employee_id);
      const present = records.filter((r) => r.status === 'Present').length;
      const absent = daysInMonth - present;

      const basic = parseFloat(emp.basic_salary);
      const allowance = parseFloat(emp.allowance);
      const gross = basic + allowance;

      const perDay = basic / daysInMonth;
      const deduction = absent * perDay;

      const hours = overtimeHours[emp.employee_id] || 0;
      const perHour = perDay / 8;
      const overtimeAmount = hours * perHour * overtimeMultiplier;

      const grossWithOT = gross + overtimeAmount;
      const tax = grossWithOT * taxRate;
      const net = grossWithOT - deduction - tax;

      return {
        employee_id: emp.employee_id,
        name: emp.name,
        presentDays: present,
        absentDays: absent,
        grossSalary: grossWithOT,
        deduction,
        overtimeAmount,
        tax,
        netSalary: net,
      };
    });

    setSalaries(slips);
  };

  return (
    <div className="p-4 border mt-10 rounded-lg space-y-4">
      <h2 className="text-xl font-bold">Salary Calculation (with Overtime & Tax)</h2>

      <div className="space-y-4">
        {employees.map((emp) => (
          <div key={emp.employee_id} className="grid grid-cols-2 gap-4 items-center">
            <label>{emp.name} ({emp.employee_id}) - Overtime Hours:</label>
            <input
              type="number"
              min={0}
              className="border p-2 rounded"
              value={overtimeHours[emp.employee_id] || ''}
              onChange={(e) => handleOvertimeChange(e, emp.employee_id)}
              placeholder="0"
            />
          </div>
        ))}
      </div>

      <Button onClick={calculate}>Calculate Salary</Button>

      {salaries.length > 0 && (
        <div className="mt-6 space-y-4">
          {salaries.map((sal, idx) => (
            <div key={idx} className="border p-4 rounded shadow">
              <p><strong>Employee:</strong> {sal.name} ({sal.employee_id})</p>
              <p><strong>Present Days:</strong> {sal.presentDays}</p>
              <p><strong>Absent Days:</strong> {sal.absentDays}</p>
              <p><strong>Overtime Earned:</strong> Rs. {sal.overtimeAmount.toFixed(2)}</p>
              <p><strong>Gross Salary:</strong> Rs. {sal.grossSalary.toFixed(2)}</p>
              <p><strong>Deduction (Absents):</strong> Rs. {sal.deduction.toFixed(2)}</p>
              <p><strong>Tax (5%):</strong> Rs. {sal.tax.toFixed(2)}</p>
              <PayslipGenerator
  employee={{
    employee_id: sal.employee_id,
    name: sal.name,
    designation: employees.find(e => e.employee_id === sal.employee_id)?.designation || '',
    department: employees.find(e => e.employee_id === sal.employee_id)?.department || '',
  }}
  salary={sal}
  month="October 2025"
/>
<TaxCertificate
  employee={{
    employee_id: sal.employee_id,
    name: sal.name,
    designation: employees.find(e => e.employee_id === sal.employee_id)?.designation || '',
    department: employees.find(e => e.employee_id === sal.employee_id)?.department || '',
    cnic: employees.find(e => e.employee_id === sal.employee_id)?.cnic || '',
  }}
  salary={{
    grossSalary: sal.grossSalary,
    tax: sal.tax,
  }}
/>


            </div>
          ))}
        </div>
      )}
    </div>
  );
}
