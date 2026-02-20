export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit/auditLog';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const line = await prisma.budgetLine.findUnique({ where: { id: params.id } });
  if (!line) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(line);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole('ADMIN', 'FINANCE_OFFICER');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const line = await prisma.budgetLine.update({
    where: { id: params.id },
    data: {
      name: body.name,
      totalAmount: body.totalAmount !== undefined ? Number(body.totalAmount) : undefined,
    },
  });

  await createAuditLog({
    action: 'UPDATE_BUDGET_LINE',
    entity: 'BudgetLine',
    entityId: params.id,
    userId: auth.userId,
  });

  return NextResponse.json(line);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole('ADMIN');
  if (auth instanceof NextResponse) return auth;

  await prisma.budgetLine.delete({ where: { id: params.id } });

  await createAuditLog({
    action: 'DELETE_BUDGET_LINE',
    entity: 'BudgetLine',
    entityId: params.id,
    userId: auth.userId,
  });

  return NextResponse.json({ success: true });
}
