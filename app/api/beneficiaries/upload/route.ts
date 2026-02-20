export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/rbac';
import { parseAndValidateExcel } from '@/lib/validators/excel';
import { createAuditLog } from '@/lib/audit/auditLog';

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN', 'FINANCE_OFFICER');
  if (auth instanceof NextResponse) return auth;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { valid, errors } = parseAndValidateExcel(buffer);

  let created = 0;
  let skipped = 0;

  for (const row of valid) {
    try {
      await prisma.beneficiary.create({
        data: { name: row.name, phone: row.phone, address: row.address },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  await createAuditLog({
    action: 'UPLOAD_BENEFICIARIES',
    entity: 'Beneficiary',
    userId: auth.userId,
    details: `Created: ${created}, Skipped: ${skipped}, Errors: ${errors.length}`,
  });

  return NextResponse.json({ created, skipped, errors });
}
