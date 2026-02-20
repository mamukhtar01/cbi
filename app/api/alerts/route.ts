export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resolved = searchParams.get('resolved');

  const alerts = await prisma.alert.findMany({
    where: resolved !== null ? { resolved: resolved === 'true' } : {},
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(alerts);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, resolved } = body;

  const alert = await prisma.alert.update({
    where: { id },
    data: { resolved },
  });
  return NextResponse.json(alert);
}
