import { NextResponse } from 'next/server';
import { inspectExcelBuffer } from '@/lib/excelImport';

export async function POST(request) {
  try {
    const { content } = await request.json();
    if (!content) return NextResponse.json({ success: false, error: 'No content' }, { status: 400 });
    const buffer = Buffer.from(content, 'base64');
    const info = inspectExcelBuffer(buffer);
    return NextResponse.json({ success: true, ...info });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
