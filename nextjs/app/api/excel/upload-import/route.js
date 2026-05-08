import { NextResponse } from 'next/server';
import { importExcelBuffer } from '@/lib/excelImport';
import pool from '@/lib/db';

export const maxDuration = 60; // allow up to 60s for large imports

export async function POST(request) {
  try {
    const { content, filename } = await request.json();
    if (!content) return NextResponse.json({ success: false, error: 'No file content received' }, { status: 400 });
    if (filename && !filename.endsWith('.xlsx'))
      return NextResponse.json({ success: false, error: 'Only .xlsx files are supported' }, { status: 400 });

    const buffer = Buffer.from(content, 'base64');
    const results = await importExcelBuffer(buffer);

    await pool.query(
      `INSERT INTO audit_log (action, table_name, new_values) VALUES ('EXCEL_UPLOAD_IMPORT','employees',$1)`,
      [JSON.stringify(results)]
    ).catch(() => {});

    return NextResponse.json({ success: true, data: results, message: 'Import complete' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
