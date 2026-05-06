const express  = require('express');
const router   = express.Router();
const watcher  = require('../watcher');
const { importExcel } = require('../controllers/excelController');
const pool     = require('../db');

// POST /api/excel/inspect — returns sheet names and first 3 rows so we can see actual column headers
router.post('/inspect', async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, error: 'No content' });
  try {
    const xlsx = require('xlsx');
    const wb = xlsx.read(Buffer.from(content, 'base64'), { type: 'buffer' });
    const info = {};
    for (const name of wb.SheetNames) {
      const raw = xlsx.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
      info[name] = raw.slice(0, 5); // first 5 rows raw
    }
    res.json({ success: true, sheets: wb.SheetNames, rows: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/excel/pending — check if a file is waiting to be imported
router.get('/pending', (req, res) => {
  const file = watcher.getPendingFile();
  res.json({ success: true, pending: !!file, file: file ? require('path').basename(file) : null });
});

// POST /api/excel/import — import the pending file (folder-watcher flow)
router.post('/import', async (req, res) => {
  const file = watcher.getPendingFile();
  if (!file)
    return res.status(400).json({ success: false, error: 'No pending file to import.' });
  try {
    const results = await importExcel(file);
    watcher.clearPendingFile();
    await pool.query(
      `INSERT INTO audit_log (action, table_name, new_values) VALUES ('EXCEL_IMPORT','employees',$1)`,
      [JSON.stringify(results)]
    ).catch(() => {});
    res.json({ success: true, data: results, message: 'Import complete' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/excel/upload-import — receive base64-encoded Excel from browser
router.post('/upload-import', async (req, res) => {
  const { content, filename } = req.body;
  if (!content)
    return res.status(400).json({ success: false, error: 'No file content received' });
  if (filename && !filename.endsWith('.xlsx'))
    return res.status(400).json({ success: false, error: 'Only .xlsx files are supported' });
  try {
    const buffer = Buffer.from(content, 'base64');
    const results = await importExcel(buffer);
    await pool.query(
      `INSERT INTO audit_log (action, table_name, new_values) VALUES ('EXCEL_UPLOAD_IMPORT','employees',$1)`,
      [JSON.stringify(results)]
    ).catch(() => {});
    res.json({ success: true, data: results, message: 'Import complete' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
