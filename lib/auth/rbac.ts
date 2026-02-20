import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';
import { NextResponse } from 'next/server';

export type Role = 'ADMIN' | 'FINANCE_OFFICER' | 'VIEWER';

export async function requireRole(
  ...roles: Role[]
): Promise<{ userId: string; role: string } | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userRole = (session.user as { role?: string }).role ?? 'VIEWER';
  if (!roles.includes(userRole as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return {
    userId: (session.user as { id?: string }).id ?? '',
    role: userRole,
  };
}

export async function getSessionUser(): Promise<{
  userId: string;
  role: string;
} | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    userId: (session.user as { id?: string }).id ?? '',
    role: (session.user as { role?: string }).role ?? 'VIEWER',
  };
}
