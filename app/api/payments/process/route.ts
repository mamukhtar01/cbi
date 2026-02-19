import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql as getSQL } from "@/lib/db"
import { sendMobilePayment } from "@/lib/telecom"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const sql = getSQL()
    const { batch_id } = await request.json()
    if (!batch_id) {
      return NextResponse.json({ error: "Batch ID required" }, { status: 400 })
    }

    // Get batch
    const batches = await sql`SELECT * FROM upload_batches WHERE id = ${batch_id}`
    if (batches.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    // Update batch status
    await sql`UPDATE upload_batches SET status = 'processing' WHERE id = ${batch_id}`

    // Get pending payments only (skip already successful ones for retry safety)
    const payments = await sql`
      SELECT * FROM payments
      WHERE batch_id = ${batch_id} AND status IN ('pending', 'failed')
      ORDER BY created_at
    `

    if (payments.length === 0) {
      return NextResponse.json({ message: "No pending payments to process", batch_id })
    }

    // Process payments sequentially (to respect API rate limits)
    let successCount = 0
    let failCount = 0

    for (const payment of payments) {
      // Update to processing
      await sql`UPDATE payments SET status = 'processing' WHERE id = ${payment.id}`

      const result = await sendMobilePayment({
        phone_number: payment.phone_number as string,
        amount: payment.amount as number,
        reference: payment.id as string,
      })

      if (result.success) {
        successCount++
        await sql`
          UPDATE payments
          SET status = 'success',
              transaction_id = ${result.transaction_id},
              processed_at = NOW(),
              error_message = NULL
          WHERE id = ${payment.id}
        `
      } else {
        failCount++
        await sql`
          UPDATE payments
          SET status = 'failed',
              error_message = ${result.message},
              processed_at = NOW()
          WHERE id = ${payment.id}
        `
      }
    }

    // Update batch status
    const allPayments = await sql`SELECT status FROM payments WHERE batch_id = ${batch_id}`
    const allSuccess = allPayments.every((p) => p.status === "success")
    const anyFailed = allPayments.some((p) => p.status === "failed")
    const batchStatus = allSuccess ? "completed" : anyFailed ? "partial" : "completed"

    await sql`
      UPDATE upload_batches
      SET status = ${batchStatus}, completed_at = NOW()
      WHERE id = ${batch_id}
    `

    return NextResponse.json({
      success: true,
      batch_id,
      processed: payments.length,
      successful: successCount,
      failed: failCount,
    })
  } catch (error) {
    console.error("Process error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
