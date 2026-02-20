import { prisma } from '@/lib/prisma';

interface AuditParams {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  details?: string;
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      userId: params.userId,
      details: params.details,
    },
  });
}
