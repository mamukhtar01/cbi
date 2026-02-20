export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getBulkJobStatus } from '@/lib/payments/bulkJobStore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  const job = await getBulkJobStatus(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}
