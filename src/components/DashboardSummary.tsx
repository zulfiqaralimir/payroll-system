'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

interface Employee {
  employee_id: string;
  name: string;
  department: string;
  designation: string;
  basic_salary: number;
  allowance: number;
}

interface SalarySlip {
  employee_id: string;
  name: string;
  grossSalary: number;
  tax: number;
  netSalary: number;
}

interface DashboardSummaryProps {
  employees: Employee[];
  salaries: SalarySlip[];
}

export default function DashboardSummary({ employees, salaries }: DashboardSummaryProps) {
  const totalEmployees = employees.length;
  const totalPayroll = salaries.reduce((acc, s) => acc + s.netSalary, 0);
  const averageSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;

  // Group salaries by department
  const deptSummary = employees.reduce((acc: any[], emp) => {
    const dept = emp.department || 'Other';
    const existing = acc.find((d) => d.department === dept);
    const empSalary = salaries.find((s) => s.employee_id === emp.employee_id)?.netSalary || 0;

    if (existing) {
      existing.totalSalary += empSalary;
      existing.count += 1;
    } else {
      acc.push({ department: dept, totalSalary: empSalary, count: 1 });
    }
    return acc;
  }, []);

  const chartData = deptSummary.map((d) => ({
    department: d.department,
    averageSalary: (d.totalSalary / d.count).toFixed(2),
  }));

  return (
    <div className="p-6 mt-10">
      <h2 className="text-2xl font-bold mb-6">📊 Payroll Dashboard Summary</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-semibold text-gray-500">Total Employees</p>
            <p className="text-2xl font-bold">{totalEmployees}</p>
          </CardContent>
        </Card>

        <Card className="shadow">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-semibold text-gray-500">Total Monthly Payroll</p>
            <p className="text-2xl font-bold text-green-600">Rs. {totalPayroll.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="shadow">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-semibold text-gray-500">Average Salary</p>
            <p className="text-2xl font-bold text-blue-600">Rs. {averageSalary.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Department-wise Average Salary Chart */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-4">Department-wise Average Salary</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="averageSalary" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
