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

  const doInspect = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      try {
        const res = await api.post('/excel/inspect', { content: base64 });
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
    };
    reader.readAsDataURL(file);
  }, []);

  const doUpload = useCallback((file) => {
    setImporting(true); setImportError(''); setResult(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result.split(',')[1];
        const res = await api.post('/excel/upload-import', {
          filename: file.name,
          content: base64,
        });
        if (res.success) { setResult(res.data); setPending(null); }
        else setImportError(res.error || 'Import failed');
      } catch (err) {
        setImportError(err.message || 'Import failed');
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file from disk');
      setImporting(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const dismiss = useCallback(() => {
    setPending(null); setResult(null); setImportError('');
  }, []);

  return { pending, importing, result, importError, doImport, doUpload, doInspect, dismiss };
}
