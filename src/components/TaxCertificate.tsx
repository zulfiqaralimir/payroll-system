'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';

interface TaxCertificateProps {
  employee: {
    employee_id: string;
    name: string;
    designation: string;
    department: string;
    cnic: string;
  };
  salary: {
    grossSalary: number;
    tax: number;
  };
}

export default function TaxCertificate({ employee, salary }: TaxCertificateProps) {
  const certRef = useRef<HTMLDivElement>(null);

  const downloadCertificate = async () => {
    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: 0.5,
      filename: `${employee.employee_id}_TaxCertificate_2025.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {},
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    html2pdf().from(certRef.current).set(opt).save();
  };

  const totalSalary = salary.grossSalary * 12;
  const totalTax = salary.tax * 12;
  const fakeRef = 'PSID-' + Math.floor(100000 + Math.random() * 900000);

  return (
    <div className="border p-4 rounded shadow mt-10">
      <div ref={certRef} className="text-sm space-y-1">
        {/* ✅ Logo + Address */}
        <div className="text-center mb-4">
          <img src="/wellserve-logo.png" alt="Wellserve Logo" className="h-12 mx-auto mb-2" />
          <h2 className="text-lg font-bold">Wellserve Oilfield Services (Pvt) Ltd.</h2>
          <p className="text-sm">
            Plot # 51 & 52, Street # 1, I - 10 / 3, Industrial Area, Islamabad<br />
            (+92 51 4100 311 – 14)
          </p>
        </div>

        <h2 className="text-xl font-bold mb-2">Annual Tax Deduction Certificate - 2025</h2>
        <p><strong>Employee ID:</strong> {employee.employee_id}</p>
        <p><strong>Name:</strong> {employee.name}</p>
        <p><strong>CNIC:</strong> {employee.cnic}</p>
        <p><strong>Designation:</strong> {employee.designation}</p>
        <p><strong>Department:</strong> {employee.department}</p>
        <hr />
        <p><strong>Total Salary (Year):</strong> Rs. {totalSalary.toFixed(2)}</p>
        <p><strong>Total Tax Paid:</strong> Rs. {totalTax.toFixed(2)}</p>
        <p><strong>PSID/CPR Ref:</strong> {fakeRef}</p>
        <p><strong>Issued:</strong> {new Date().toLocaleDateString()}</p>
      </div>

      <Button className="mt-4" onClick={downloadCertificate}>
        Download Tax Certificate (PDF)
      </Button>
    </div>
  );
}
