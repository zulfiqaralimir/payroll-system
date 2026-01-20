'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule, RowSelectionModule } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Employee, Attendance } from '@/app/page';

// Register required modules for v33
ModuleRegistry.registerModules([ClientSideRowModelModule, RowSelectionModule]);

interface AttendanceGridProps {
  attendance: Attendance[];
  setAttendance: (attendance: Attendance[]) => void;
  employees: Employee[];
}

export default function AttendanceGrid({ attendance, setAttendance, employees }: AttendanceGridProps) {
  const gridRef = useRef<any>(null);

  const columnDefs = useMemo(() => [
    { 
      field: 'employee_id', 
      headerName: 'Employee ID', 
      editable: true, 
      width: 150, 
      checkboxSelection: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: employees.map(e => e.employee_id) },
      cellStyle: { backgroundColor: '#f0f9ff' }
    },
    { 
      field: 'employee_name', 
      headerName: 'Employee Name', 
      width: 200, 
      editable: false,
      valueGetter: (p: any) => employees.find(e => e.employee_id === p.data.employee_id)?.name || 'Unknown',
      cellStyle: { backgroundColor: '#f9fafb' }
    },
    { field: 'date', headerName: 'Date (DD/MM/YYYY)', editable: true, width: 170 },
    { 
      field: 'status', 
      headerName: 'Status', 
      editable: true, 
      width: 130,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['Present', 'Absent'] },
      cellStyle: (p: any) => {
        if (p.value === 'Present') return { backgroundColor: '#d4edda', color: '#155724', fontWeight: '600' };
        if (p.value === 'Absent') return { backgroundColor: '#f8d7da', color: '#721c24', fontWeight: '600' };
        return null;
      }
    },
  ], [employees]);

  const defaultColDef = useMemo(() => ({ sortable: true, resizable: true }), []);

  const onCellValueChanged = useCallback((e: any) => {
    const updated = [...attendance];
    updated[e.rowIndex] = e.data;
    setAttendance(updated);
  }, [attendance, setAttendance]);

  const addNewRow = () => {
    if (employees.length === 0) return alert('Please add employees first');
    const today = new Date();
    const date = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    setAttendance([...attendance, { employee_id: employees[0].employee_id, date, status: 'Present' }]);
  };

  const markAllPresent = () => {
    if (employees.length === 0) return alert('Please add employees first');
    const today = new Date();
    const date = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    setAttendance([...attendance, ...employees.map(e => ({ employee_id: e.employee_id, date, status: 'Present' as const }))]);
  };

  const deleteSelectedRows = () => {
    const selected = gridRef.current?.api.getSelectedRows();
    if (selected?.length > 0) {
      setAttendance(attendance.filter(a => !selected.find((s: Attendance) => s.employee_id === a.employee_id && s.date === a.date)));
    } else {
      alert('Please select rows to delete');
    }
  };

  const exportToCsv = () => {
    const csv = [
      ['Employee ID', 'Employee Name', 'Date', 'Status'],
      ...attendance.map(a => [a.employee_id, employees.find(e => e.employee_id === a.employee_id)?.name || 'Unknown', a.date, a.status])
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const stats = {
    totalRecords: attendance.length,
    presentCount: attendance.filter(a => a.status === 'Present').length,
    absentCount: attendance.filter(a => a.status === 'Absent').length
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button onClick={addNewRow} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          ➕ Add Attendance
        </button>
        <button onClick={markAllPresent} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
          ✓ Mark All Present Today
        </button>
        <button onClick={deleteSelectedRows} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
          🗑️ Delete Selected
        </button>
        <button onClick={exportToCsv} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
          📥 Export to CSV
        </button>
        <button onClick={() => confirm('Clear all?') && setAttendance([])} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition">
          🗑️ Clear All
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div className="px-4 py-2 bg-blue-50 rounded border border-blue-200">
          <span className="font-semibold">Total Records:</span> {stats.totalRecords}
        </div>
        <div className="px-4 py-2 bg-green-50 rounded border border-green-200">
          <span className="font-semibold">Present:</span> {stats.presentCount}
        </div>
        <div className="px-4 py-2 bg-red-50 rounded border border-red-200">
          <span className="font-semibold">Absent:</span> {stats.absentCount}
        </div>
      </div>

      <div className="ag-theme-alpine border rounded-lg shadow-sm" style={{ height: 400, width: '100%' }}>
        <AgGridReact
          theme="legacy"
          ref={gridRef}
          rowData={attendance}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          rowSelection="multiple"
          pagination={true}
          paginationPageSize={15}
        />
      </div>

      <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded border">
        <p className="font-semibold mb-2">💡 Quick Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click Employee ID to select from dropdown • Click Status to choose Present/Absent</li>
          <li>Use "Mark All Present Today" for quick attendance • Green = Present, Red = Absent</li>
          <li>Date format: DD/MM/YYYY (e.g., 21/01/2026)</li>
        </ul>
      </div>
    </div>
  );
}