import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql as getSQL } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const sql = getSQL()
    const { id } = await params

    const batches = await sql`SELECT * FROM upload_batches WHERE id = ${id}`
    if (batches.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    const payments = await sql`
      SELECT * FROM payments WHERE batch_id = ${id} ORDER BY created_at
    `

    const statusCounts = {
      pending: 0,
      processing: 0,
      success: 0,
      failed: 0,
    }
    for (const p of payments) {
      const status = p.status as keyof typeof statusCounts
      if (status in statusCounts) statusCounts[status]++
    }

    return NextResponse.json({
      batch: batches[0],
      payments,
      status_counts: statusCounts,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
