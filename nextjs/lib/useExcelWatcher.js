'use client';

import { useEffect, useState, useCallback } from 'react';
import api from './api';

export function useExcelWatcher() {
  const [pending,     setPending]     = useState(null);
  const [importing,   setImporting]   = useState(false);
  const [result,      setResult]      = useState(null);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    api.get('/excel/pending').then(r => {
      if (r.success && r.pending) {
        setPending({ file: r.file, message: 'Excel file is ready to import.' });
      }
    }).catch(() => {});
  }, []);

  const doImport = useCallback(async () => {
    setImporting(true); setImportError('');
    try {
      const res = await api.post('/excel/import', {});
      if (res.success) { setResult(res.data); setPending(null); }
      else setImportError(res.error || 'Import failed');
    } catch (err) {
      setImportError(err.message || 'Import failed');
    } finally { setImporting(false); }
  }, []);

  const doInspect = useCallback(async (file) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.postForm('/excel/inspect', form);
      console.log('=== EXCEL INSPECT ===');
      if (res.sheets) {
        for (const sheet of res.sheets) {
          console.log(`\nSheet: ${sheet}`);
          console.log('First 5 rows:', res.rows[sheet]);
        }
      }
      alert('Check browser console (F12) for column names in your Excel file.');
    } catch (err) {
      console.error('Inspect error:', err);
    }
  }, []);

  const doUpload = useCallback(async (file) => {
    setImporting(true); setImportError(''); setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.postForm('/excel/upload-import', form);
      if (res.success) { setResult(res.data); setPending(null); }
      else setImportError(res.error || 'Import failed');
    } catch (err) {
      setImportError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    setPending(null); setResult(null); setImportError('');
  }, []);

  return { pending, importing, result, importError, doImport, doUpload, doInspect, dismiss };
}
