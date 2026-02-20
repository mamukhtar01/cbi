export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit/auditLog';
import { validatePhone } from '@/lib/validators/phone';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: params.id },
    include: { payments: true },
  });
  if (!beneficiary) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(beneficiary);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole('ADMIN', 'FINANCE_OFFICER');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { name, phone, address, status } = body;

  if (phone) {
    try {
      validatePhone(phone);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  const beneficiary = await prisma.beneficiary.update({
    where: { id: params.id },
    data: { name, phone, address, status },
  });

  await createAuditLog({
    action: 'UPDATE_BENEFICIARY',
    entity: 'Beneficiary',
    entityId: params.id,
    userId: auth.userId,
  });

  return NextResponse.json(beneficiary);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole('ADMIN');
  if (auth instanceof NextResponse) return auth;

  await prisma.beneficiary.delete({ where: { id: params.id } });

  await createAuditLog({
    action: 'DELETE_BENEFICIARY',
    entity: 'Beneficiary',
    entityId: params.id,
    userId: auth.userId,
  });

  return NextResponse.json({ success: true });
}
