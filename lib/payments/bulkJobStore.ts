import { prisma } from '@/lib/prisma';
import { processPayment, PaymentInput } from './paymentService';

export async function createBulkJob(total: number): Promise<string> {
  const job = await prisma.bulkJob.create({
    data: { total, status: 'RUNNING' },
  });
  return job.id;
}

export async function getBulkJobStatus(jobId: string) {
  return prisma.bulkJob.findUnique({ where: { id: jobId } });
}

export async function processBulkPayments(
  jobId: string,
  payments: PaymentInput[],
  chunkSize = 5
): Promise<void> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < payments.length; i += chunkSize) {
    const chunk = payments.slice(i, i + chunkSize);

    for (const payment of chunk) {
      const result = await processPayment(payment);
      processed++;
      if (result.success && result.status === 'SUCCESS') {
        succeeded++;
      } else {
        failed++;
      }

      await prisma.bulkJob.update({
        where: { id: jobId },
        data: { processed, succeeded, failed },
      });
    }
  }

  await prisma.bulkJob.update({
    where: { id: jobId },
    data: { status: 'COMPLETED' },
  });
}
