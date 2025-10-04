'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Attendance, Employee } from '@/app/page';

interface Props {
  attendance: Attendance[];
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
  employees: Employee[];
}

export default function AttendanceForm({ attendance, setAttendance, employees }: Props) {
  const [form, setForm] = React.useState<Attendance>({
    employee_id: '',
    date: '',
    status: 'Present',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value as 'Present' | 'Absent' });
  };

  const handleAdd = () => {
    setAttendance([...attendance, form]);
    setForm({ employee_id: '', date: '', status: 'Present' });
  };

  return (
    <div className="p-4 space-y-4 border mt-10 rounded-lg">
      <h2 className="text-xl font-bold">Attendance Tracking</h2>

      <div className="grid grid-cols-3 gap-4">
        <select name="employee_id" value={form.employee_id} onChange={handleChange} className="border p-2 rounded">
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp.employee_id} value={emp.employee_id}>
              {emp.name} ({emp.employee_id})
            </option>
          ))}
        </select>

        <Input name="date" type="date" value={form.date} onChange={handleChange} />
        <select name="status" value={form.status} onChange={handleChange} className="border p-2 rounded">
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
        </select>
      </div>

      <Button onClick={handleAdd}>Add Attendance</Button>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Attendance Records</h3>
        <ul className="list-disc pl-5 space-y-1">
          {attendance.map((record, index) => (
            <li key={index}>
              {record.employee_id} - {record.date} - {record.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
