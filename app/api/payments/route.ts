export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/rbac';
import { processPayment } from '@/lib/payments/paymentService';

export async function GET() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { beneficiary: true, budgetLine: true },
  });
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN', 'FINANCE_OFFICER');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { beneficiaryId, budgetLineId, amount } = body;

  if (!beneficiaryId || !budgetLineId || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const result = await processPayment({
    beneficiaryId,
    budgetLineId,
    amount: Number(amount),
    userId: auth.userId,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 422 });
  }

  return NextResponse.json(result, { status: 201 });
}
