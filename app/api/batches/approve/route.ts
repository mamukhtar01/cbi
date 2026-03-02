import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql as getSQL } from "@/lib/db"
import type { PaymentProvider } from "@/lib/telecom"

const VALID_PROVIDERS: PaymentProvider[] = ["mock", "mtn_momo", "mpesa"]

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const sql = getSQL()
    const body = await request.json()
    const {
      batch_id,
      approve,
      payment_provider = "mock",
    } = body as { batch_id: string; approve: boolean; payment_provider?: string }

    if (!batch_id) {
      return NextResponse.json({ error: "batch_id is required" }, { status: 400 })
    }
    if (typeof approve !== "boolean") {
      return NextResponse.json({ error: "approve (boolean) is required" }, { status: 400 })
    }
    if (approve && !VALID_PROVIDERS.includes(payment_provider as PaymentProvider)) {
      return NextResponse.json(
        { error: `Invalid payment_provider. Must be one of: ${VALID_PROVIDERS.join(", ")}` },
        { status: 400 },
      )
    }

    // Fetch the batch
    const batches = await sql`SELECT * FROM upload_batches WHERE id = ${batch_id}`
    if (batches.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    const batch = batches[0]
    if (batch.status !== "pending_approval") {
      return NextResponse.json(
        { error: `Batch cannot be approved/rejected from status '${batch.status}'` },
        { status: 409 },
      )
    }

    if (approve) {
      await sql`
        UPDATE upload_batches
        SET status = 'approved',
            approved_at = NOW(),
            payment_provider = ${payment_provider}
        WHERE id = ${batch_id}
      `
      return NextResponse.json({
        success: true,
        batch_id,
        status: "approved",
        approved_by: session.username,
        payment_provider,
      })
    } else {
      await sql`
        UPDATE upload_batches
        SET status = 'rejected',
            approved_at = NOW()
        WHERE id = ${batch_id}
      `
      return NextResponse.json({
        success: true,
        batch_id,
        status: "rejected",
        approved_by: session.username,
      })
    }
  } catch (error) {
    console.error("Approve error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
