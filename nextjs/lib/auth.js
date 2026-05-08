import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export function verifyToken(request) {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function requireAuth(request, allowedRoles = []) {
  const user = verifyToken(request);
  if (!user) {
    return { error: NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 }) };
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return { error: NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 }) };
  }
  return { user };
}
