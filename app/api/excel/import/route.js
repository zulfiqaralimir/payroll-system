import { NextResponse } from 'next/server';

// Folder-watcher import not available in Next.js; use /excel/upload-import instead
export async function POST() {
  return NextResponse.json({ success: false, error: 'Use Browse & Import button to upload the Excel file directly.' }, { status: 400 });
}
