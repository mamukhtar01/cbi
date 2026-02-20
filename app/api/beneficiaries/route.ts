export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit/auditLog';
import { validatePhone } from '@/lib/validators/phone';

export async function GET() {
  const beneficiaries = await prisma.beneficiary.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(beneficiaries);
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN', 'FINANCE_OFFICER');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { name, phone, address } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
  }

  try {
    validatePhone(phone);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  try {
    const beneficiary = await prisma.beneficiary.create({
      data: { name, phone, address },
    });

    await createAuditLog({
      action: 'CREATE_BENEFICIARY',
      entity: 'Beneficiary',
      entityId: beneficiary.id,
      userId: auth.userId,
      details: `Created beneficiary ${name}`,
    });

    return NextResponse.json(beneficiary, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Phone number already exists' }, { status: 409 });
  }
}
