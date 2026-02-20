import { prisma } from '@/lib/prisma';
import { pushToWave } from '@/lib/integrations/waveClient';
import { createAuditLog } from '@/lib/audit/auditLog';

export interface ReconciliationResult {
  total: number;
  reconciled: number;
  failed: number;
}

export async function reconcilePayments(
  userId?: string
): Promise<ReconciliationResult> {
  const payments = await prisma.payment.findMany({
    where: { status: 'SUCCESS', reconciledAt: null },
    include: { beneficiary: true },
  });

  let reconciled = 0;
  let failed = 0;

  for (const payment of payments) {
    const result = await pushToWave(
      payment.beneficiary.phone,
      payment.amount,
      payment.reference
    );

    await prisma.wavePush.create({
      data: {
        paymentId: payment.id,
        status: result.success ? 'SUCCESS' : 'FAILED',
        waveRef: result.waveRef,
      },
    });

    if (result.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { reconciledAt: new Date() },
      });
      reconciled++;
    } else {
      failed++;
    }
  }

  await createAuditLog({
    action: 'RECONCILIATION_RUN',
    entity: 'Payment',
    userId,
    details: `Reconciled: ${reconciled}, Failed: ${failed}`,
  });

  return { total: payments.length, reconciled, failed };
}
