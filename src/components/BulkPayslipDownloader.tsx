'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import PayslipGenerator from './PayslipGenerator';

interface Props {
  employees: {
    employee_id: string;
    name: string;
    designation: string;
    department: string;
  }[];
  salaries: {
    employee_id: string;
    presentDays: number;
    absentDays: number;
    grossSalary: number;
    deduction: number;
    overtimeAmount: number;
    tax: number;
    netSalary: number;
  }[];
  month: string;
}

export default function BulkPayslipDownloader({ employees, salaries, month }: Props) {
  const downloadAll = async () => {
    const html2pdf = (await import('html2pdf.js')).default;

    for (const emp of employees) {
      const sal = salaries.find((s) => s.employee_id === emp.employee_id);
      if (!sal) continue;

      const container = document.createElement('div');
      document.body.appendChild(container);

      const payslipHTML = (
        <PayslipGenerator employee={emp} salary={sal} month={month} />
      );

      const root = document.createElement('div');
      container.appendChild(root);
      root.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Generating payslip for ${emp.name}</h2>
        </div>
      `;

      await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for UI render

      html2pdf()
        .from(container)
        .set({
          margin: 0.5,
          filename: `${emp.employee_id}_Payslip_${month}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {},
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        })
        .save();

      document.body.removeChild(container);
    }
  };

  return (
    <div className="mt-6">
      <Button onClick={downloadAll}>Download All Payslips (PDF)</Button>
    </div>
  );
}
