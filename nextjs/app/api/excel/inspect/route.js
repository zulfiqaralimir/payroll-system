import { NextResponse } from 'next/server';
import { inspectExcelBuffer } from '@/lib/excelImport';

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file) return NextResponse.json({ success: false, error: 'No file received' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const info = inspectExcelBuffer(buffer);
    return NextResponse.json({ success: true, ...info });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
