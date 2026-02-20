import { prisma } from '@/lib/prisma';
import { sendPaymentToTelecom } from './telecomMock';
import { createAlert } from './anomalyDetection';
import { createAuditLog } from '@/lib/audit/auditLog';

export interface PaymentInput {
  beneficiaryId: string;
  budgetLineId: string;
  amount: number;
  userId?: string;
}

export interface PaymentResult {
  success: boolean;
  message: string;
  paymentId?: string;
  status?: string;
}

export async function processPayment(
  input: PaymentInput
): Promise<PaymentResult> {
  const { beneficiaryId, budgetLineId, amount, userId } = input;

  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: beneficiaryId },
  });
  if (!beneficiary) {
    return { success: false, message: 'Beneficiary not found' };
  }

  const existing = await prisma.payment.findFirst({
    where: { beneficiaryId, status: 'SUCCESS' },
  });
  if (existing) {
    await createAlert(
      'DUPLICATE',
      `Beneficiary ${beneficiary.name} (${beneficiary.phone}) already has a successful payment`,
      existing.id
    );
    return {
      success: false,
      message: 'Beneficiary already has a successful payment (duplicate blocked)',
    };
  }

  const budgetLine = await prisma.budgetLine.findUnique({
    where: { id: budgetLineId },
  });
  if (!budgetLine) {
    return { success: false, message: 'Budget line not found' };
  }

  const remaining = budgetLine.totalAmount - budgetLine.usedAmount;
  if (amount > remaining) {
    await createAlert(
      'OVER_DISBURSEMENT',
      `Payment of ${amount} exceeds remaining budget of ${remaining} for line "${budgetLine.name}"`
    );
    return {
      success: false,
      message: `Payment amount ${amount} exceeds remaining budget ${remaining}`,
    };
  }

  const payment = await prisma.payment.create({
    data: {
      beneficiaryId,
      budgetLineId,
      amount,
      status: 'PENDING',
    },
  });

  const telecomResult = await sendPaymentToTelecom(beneficiary.phone, amount);

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: telecomResult.status,
      telecomRef: telecomResult.reference,
    },
  });

  if (telecomResult.status === 'SUCCESS') {
    await prisma.budgetLine.update({
      where: { id: budgetLineId },
      data: { usedAmount: { increment: amount } },
    });
  }

  if (telecomResult.status === 'FAILED') {
    await createAlert(
      'FAILED',
      `Payment to ${beneficiary.name} (${beneficiary.phone}) failed: ${telecomResult.message}`,
      payment.id
    );
  } else if (telecomResult.status === 'DELAYED') {
    await createAlert(
      'DELAYED',
      `Payment to ${beneficiary.name} (${beneficiary.phone}) delayed: ${telecomResult.message}`,
      payment.id
    );
  }

  await createAuditLog({
    action: 'PAYMENT_PROCESSED',
    entity: 'Payment',
    entityId: payment.id,
    userId,
    details: `Amount: ${amount}, Status: ${telecomResult.status}, Beneficiary: ${beneficiary.name}`,
  });

  return {
    success: true,
    message: telecomResult.message,
    paymentId: payment.id,
    status: telecomResult.status,
  };
}
