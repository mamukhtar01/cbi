export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit/auditLog';

export async function GET() {
  const lines = await prisma.budgetLine.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(lines);
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN', 'FINANCE_OFFICER');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { name, totalAmount } = body;

  if (!name || totalAmount === undefined) {
    return NextResponse.json({ error: 'Name and totalAmount required' }, { status: 400 });
  }

  const line = await prisma.budgetLine.create({
    data: { name, totalAmount: Number(totalAmount) },
  });

  await createAuditLog({
    action: 'CREATE_BUDGET_LINE',
    entity: 'BudgetLine',
    entityId: line.id,
    userId: auth.userId,
  });

  return NextResponse.json(line, { status: 201 });
}
