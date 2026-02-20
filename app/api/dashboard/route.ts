export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [
    totalBeneficiaries,
    totalPayments,
    successPayments,
    failedPayments,
    delayedPayments,
    pendingPayments,
    budgetLines,
    recentAlerts,
    paymentsByStatus,
  ] = await Promise.all([
    prisma.beneficiary.count(),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: 'SUCCESS' } }),
    prisma.payment.count({ where: { status: 'FAILED' } }),
    prisma.payment.count({ where: { status: 'DELAYED' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.budgetLine.findMany(),
    prisma.alert.findMany({ where: { resolved: false }, take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.payment.groupBy({ by: ['status'], _count: { id: true } }),
  ]);

  const totalDisbursed = await prisma.payment.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true },
  });

  return NextResponse.json({
    totalBeneficiaries,
    totalPayments,
    successPayments,
    failedPayments,
    delayedPayments,
    pendingPayments,
    totalDisbursed: totalDisbursed._sum.amount ?? 0,
    budgetLines,
    recentAlerts,
    paymentsByStatus,
  });
}
