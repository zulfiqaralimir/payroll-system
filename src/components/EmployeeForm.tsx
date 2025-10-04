'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Employee } from '@/app/page';

interface Props {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

export default function EmployeeForm({ employees, setEmployees }: Props) {
  const [form, setForm] = React.useState<Employee>({
    employee_id: '',
    name: '',
    father_name: '',
    cnic: '',
    date_of_joining: '',
    designation: '',
    pay_scale: '',
    department: '',
    basic_salary: '',
    allowance: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    setEmployees([...employees, form]);
    setForm({
      employee_id: '',
      name: '',
      father_name: '',
      cnic: '',
      date_of_joining: '',
      designation: '',
      pay_scale: '',
      department: '',
      basic_salary: '',
      allowance: '',
    });
  };

  return (
    <div className="p-4 space-y-4 border rounded-lg">
      <h2 className="text-xl font-semibold">Employee Master Data</h2>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(form).map(([key, value]) => (
          <Input
            key={key}
            name={key}
            value={value}
            placeholder={key.replace(/_/g, ' ').toUpperCase()}
            onChange={handleChange}
          />
        ))}
      </div>
      <Button onClick={handleAdd}>Add Employee</Button>
    </div>
  );
}
