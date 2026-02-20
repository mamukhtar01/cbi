export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/rbac';
import { reconcilePayments } from '@/lib/payments/reconciliationService';

export async function POST() {
  const auth = await requireRole('ADMIN', 'FINANCE_OFFICER');
  if (auth instanceof NextResponse) return auth;

  const result = await reconcilePayments(auth.userId);
  return NextResponse.json(result);
}
