import { prisma } from '@/lib/prisma';

type AlertType = 'FAILED' | 'DELAYED' | 'DUPLICATE' | 'OVER_DISBURSEMENT';

export async function createAlert(
  type: AlertType,
  message: string,
  paymentId?: string
): Promise<void> {
  await prisma.alert.create({
    data: {
      type,
      message,
      paymentId,
    },
  });
}
