import React, { useRef } from 'react';
import { useExcelWatcher } from '../hooks/useExcelWatcher';

export default function ExcelImportBanner() {
  const { pending, importing, result, importError, doImport, doUpload, doInspect, dismiss } = useExcelWatcher();
  const fileRef    = useRef(null);
  const inspectRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) doUpload(file);
    e.target.value = '';
  };

  const handleInspect = (e) => {
    const file = e.target.files[0];
    if (file) doInspect(file);
    e.target.value = '';
  };

  // ── Result panel ──────────────────────────────────────────────────────────
  if (result) {
    const hasErrors = result.errors?.length > 0;
    return (
      <div className={`mx-6 mt-4 rounded-xl border p-4 shadow-sm ${hasErrors ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">{hasErrors ? '⚠️' : '✅'}</span>
            <div>
              <p className={`font-semibold text-sm ${hasErrors ? 'text-yellow-800' : 'text-green-800'}`}>
                Excel import complete
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <ResultBadge label="Employees"    count={result.employees}       color="blue"   />
                <ResultBadge label="Salary Rates" count={result.salary_rates}    color="green"  />
                <ResultBadge label="OT Rates"     count={result.overtime_rates}  color="purple" />
                <ResultBadge label="Rig/Travel"   count={result.rig_bonus_rates} color="orange" />
                <ResultBadge label="Monthly Data" count={result.monthly_input}   color="teal"   />
              </div>
              {hasErrors && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-red-700 mb-1">Errors ({result.errors.length}):</p>
                  <ul className="space-y-0.5 max-h-28 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-600 font-mono">• {e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ── Error panel ───────────────────────────────────────────────────────────
  if (importError) {
    return (
      <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-red-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {importError}
        </div>
        <button onClick={dismiss} className="text-red-400 hover:text-red-600 ml-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  // ── Importing spinner ─────────────────────────────────────────────────────
  if (importing) {
    return (
      <div className="mx-6 mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm flex items-center gap-3">
        <svg className="animate-spin h-5 w-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-sm font-semibold text-blue-800">Importing Excel data, please wait...</p>
      </div>
    );
  }

  // ── Folder watcher: file detected ─────────────────────────────────────────
  if (pending) {
    return (
      <div className="mx-6 mt-4 rounded-xl border border-blue-200 bg-blue-50 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">{pending.message}</p>
              <p className="text-xs text-blue-600 mt-0.5">{pending.file}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={doImport}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Now
            </button>
            <button onClick={dismiss}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors">
              Later
            </button>
          </div>
        </div>
        <div className="border-t border-blue-100 px-4 py-2 flex gap-4 text-xs text-blue-700">
          {['Employees','Salary Rates','OT Rates','Rig/Travel','Monthly Data'].map(s => (
            <span key={s} className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {s}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── Default: always-visible import button ─────────────────────────────────
  return (
    <>
      <input ref={fileRef}    type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
      <input ref={inspectRef} type="file" accept=".xlsx" className="hidden" onChange={handleInspect} />
      <div className="mx-6 mt-4 rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Select <strong className="text-gray-700 mx-1">WellServe-HR-Data.xlsx</strong> to import employees, salary rates and monthly data
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => inspectRef.current?.click()}
            className="px-3 py-2 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg bg-white transition-colors">
            Inspect Headers
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:border-blue-400 hover:text-blue-600 text-sm font-medium text-gray-600 rounded-lg transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Browse & Import
          </button>
        </div>
      </div>
    </>
  );
}

function ResultBadge({ label, count, color }) {
  const colors = {
    blue:   'bg-blue-100 text-blue-700',
    green:  'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    teal:   'bg-teal-100 text-teal-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full font-medium ${colors[color] || colors.blue}`}>
      {count} {label}
    </span>
  );
}
