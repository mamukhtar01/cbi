export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/rbac';
import { createBulkJob, processBulkPayments } from '@/lib/payments/bulkJobStore';

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN', 'FINANCE_OFFICER');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { payments } = body;

  if (!Array.isArray(payments) || payments.length === 0) {
    return NextResponse.json({ error: 'payments array required' }, { status: 400 });
  }

  const jobId = await createBulkJob(payments.length);

  processBulkPayments(
    jobId,
    payments.map((p: { beneficiaryId: string; budgetLineId: string; amount: number }) => ({
      ...p,
      userId: auth.userId,
    }))
  ).catch(console.error);

  return NextResponse.json({ jobId }, { status: 202 });
}
