import { NextResponse } from 'next/server';

// No folder watcher in Next.js — browser upload is used instead
export async function GET() {
  return NextResponse.json({ success: true, pending: false, file: null });
}
