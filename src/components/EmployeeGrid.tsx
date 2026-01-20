'use client';

import React, { useState } from 'react';
import { Employee } from '@/app/page';

interface EmployeeGridProps {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
}

export default function EmployeeGrid({ employees, setEmployees }: EmployeeGridProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const updateCell = (index: number, field: keyof Employee, value: string) => {
    const updated = [...employees];
    updated[index] = { ...updated[index], [field]: value };
    setEmployees(updated);
  };

  const addNewRow = () => {
    setEmployees([...employees, {
      employee_id: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
      name: '', father_name: '', cnic: '', date_of_joining: '',
      designation: '', pay_scale: '', department: '', basic_salary: '', allowance: ''
    }]);
  };

  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const deleteSelected = () => {
    if (selectedRows.size === 0) {
      alert('Please select rows to delete');
      return;
    }
    const filtered = employees.filter((_, i) => !selectedRows.has(i));
    setEmployees(filtered);
    setSelectedRows(new Set());
  };

  const exportToCsv = () => {
    const csv = [
      ['Employee ID', 'Name', 'Father Name', 'CNIC', 'Date', 'Designation', 'Pay Scale', 'Dept', 'Salary', 'Allowance'],
      ...employees.map(e => [e.employee_id, e.name, e.father_name, e.cnic, e.date_of_joining, e.designation, e.pay_scale, e.department, e.basic_salary, e.allowance])
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button onClick={addNewRow} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          ➕ Add New Employee
        </button>
        <button onClick={deleteSelected} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
          🗑️ Delete Selected
        </button>
        <button onClick={exportToCsv} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
          📥 Export to CSV
        </button>
        <button onClick={() => confirm('Clear all?') && setEmployees([])} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition">
          🗑️ Clear All
        </button>
      </div>

      <div className="px-4 py-2 bg-blue-50 rounded text-sm">
        <span className="font-semibold">Total Employees:</span> {employees.length}
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">☑</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Employee ID</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Father Name</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">CNIC</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Date of Joining</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Designation</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Pay Scale</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Department</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Basic Salary</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Allowance</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, i) => (
              <tr key={i} className={`border-b hover:bg-gray-50 ${selectedRows.has(i) ? 'bg-blue-50' : ''}`}>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(i)}
                    onChange={() => toggleRow(i)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={emp.employee_id}
                    onChange={(e) => updateCell(i, 'employee_id', e.target.value)}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={emp.name}
                    onChange={(e) => updateCell(i, 'name', e.target.value)}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter name"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={emp.father_name}
                    onChange={(e) => updateCell(i, 'father_name', e.target.value)}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={emp.cnic}
                    onChange={(e) => updateCell(i, 'cnic', e.target.value)}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={emp.date_of_joining}
                    onChange={(e) => updateCell(i, 'date_of_joining', e.target.value)}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="DD/MM/YYYY"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={emp.designation}
                    onChange={(e) => updateCell(i, 'designation', e.target.value)}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={emp.pay_scale}
                    onChange={(e) => updateCell(i, 'pay_scale', e.target.value)}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={emp.department}
                    onChange={(e) => updateCell(i, 'department', e.target.value)}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={emp.basic_salary}
                    onChange={(e) => updateCell(i, 'basic_salary', e.target.value)}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={emp.allowance}
                    onChange={(e) => updateCell(i, 'allowance', e.target.value)}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {employees.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No employees yet. Click "Add New Employee" to get started.
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded border">
        <p className="font-semibold mb-2">💡 Quick Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Edit:</strong> Click any field and start typing immediately</li>
          <li><strong>Navigate:</strong> Press Tab to move to next field</li>
          <li><strong>Select:</strong> Check the boxes on the left to select rows</li>
          <li><strong>Delete:</strong> Select rows and click "Delete Selected"</li>
        </ul>
      </div>
    </div>
  );
}