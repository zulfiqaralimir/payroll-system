'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';

interface PayslipProps {
  employee: {
    employee_id: string;
    name: string;
    designation: string;
    department: string;
  };
  salary: {
    presentDays: number;
    absentDays: number;
    grossSalary: number;
    deduction: number;
    overtimeAmount: number;
    tax: number;
    netSalary: number;
  };
  month: string;
}

export default function PayslipGenerator({ employee, salary, month }: PayslipProps) {
  const slipRef = useRef(null);

  const downloadPDF = async () => {
    if (!slipRef.current) return;

    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: 0.5,
      filename: `${employee.employee_id}_Payslip_${month}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {},
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    html2pdf().from(slipRef.current).set(opt).save();
  };

  return (
    <div className="border p-4 rounded shadow mt-10">
      <div ref={slipRef} className="space-y-2 text-sm">
        {/* ✅ Logo + Address */}
        <div className="text-center mb-4">
          <img src="/wellserve-logo.png" alt="Wellserve Logo" className="h-12 mx-auto mb-2" />
          <h2 className="text-lg font-bold">Wellserve Oilfield Services (Pvt) Ltd.</h2>
          <p className="text-sm">
            Plot # 51 & 52, Street # 1, I - 10 / 3, Industrial Area, Islamabad<br />
            (+92 51 4100 311 – 14)
          </p>
        </div>

        <h2 className="text-xl font-bold mb-2">Payslip - {month}</h2>
        <p><strong>Name:</strong> {employee.name}</p>
        <p><strong>ID:</strong> {employee.employee_id}</p>
        <p><strong>Designation:</strong> {employee.designation}</p>
        <p><strong>Department:</strong> {employee.department}</p>
        <hr />
        <p><strong>Present Days:</strong> {salary.presentDays}</p>
        <p><strong>Absent Days:</strong> {salary.absentDays}</p>
        <p><strong>Gross Salary:</strong> Rs. {salary.grossSalary.toFixed(2)}</p>
        <p><strong>Overtime:</strong> Rs. {salary.overtimeAmount.toFixed(2)}</p>
        <p><strong>Deductions (Absents):</strong> Rs. {salary.deduction.toFixed(2)}</p>
        <p><strong>Tax:</strong> Rs. {salary.tax.toFixed(2)}</p>
        <p><strong>Net Salary:</strong> <strong>Rs. {salary.netSalary.toFixed(2)}</strong></p>
      </div>

      <Button className="mt-4" onClick={downloadPDF}>
        Download Payslip as PDF
      </Button>
    </div>
  );
}
