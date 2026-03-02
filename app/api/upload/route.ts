import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql as getSQL } from "@/lib/db"

interface PaymentRow {
  recipient_name: string
  phone_number: string
  amount: number
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const sql = getSQL()
    const body = await request.json()
    const { file_name, payments } = body as { file_name: string; payments: PaymentRow[] }

    if (!file_name || !payments || payments.length === 0) {
      return NextResponse.json({ error: "File name and payments data required" }, { status: 400 })
    }

    // Validate each row
    const errors: { row: number; message: string }[] = []
    const validPayments: PaymentRow[] = []

    payments.forEach((p, idx) => {
      const rowNum = idx + 1
      if (!p.recipient_name || p.recipient_name.trim() === "") {
        errors.push({ row: rowNum, message: "Missing recipient name" })
        return
      }
      if (!p.phone_number || p.phone_number.trim() === "") {
        errors.push({ row: rowNum, message: "Missing phone number" })
        return
      }
      if (!p.amount || isNaN(p.amount) || p.amount <= 0) {
        errors.push({ row: rowNum, message: "Invalid amount" })
        return
      }
      validPayments.push({
        recipient_name: p.recipient_name.trim(),
        phone_number: p.phone_number.trim(),
        amount: Number(p.amount),
      })
    })

    if (validPayments.length === 0) {
      return NextResponse.json({ error: "No valid payment rows found", errors }, { status: 400 })
    }

    // Check for duplicates within the upload
    const phoneSet = new Set<string>()
    const duplicates: string[] = []
    for (const p of validPayments) {
      if (phoneSet.has(p.phone_number)) {
        duplicates.push(p.phone_number)
      }
      phoneSet.add(p.phone_number)
    }

    // Check for recent successful payments (last 24 hours) to same phone numbers
    const phones = validPayments.map((p) => p.phone_number)
    const recentPayments = await sql`
      SELECT DISTINCT phone_number FROM payments
      WHERE phone_number = ANY(${phones})
        AND status = 'success'
        AND processed_at > NOW() - INTERVAL '24 hours'
    `
    const recentPhones = recentPayments.map((r) => r.phone_number as string)

    const totalAmount = validPayments.reduce((sum, p) => sum + p.amount, 0)

    // Create the batch (starts in pending_approval – must be approved before processing)
    const batch = await sql`
      INSERT INTO upload_batches (file_name, total_recipients, total_amount, status)
      VALUES (${file_name}, ${validPayments.length}, ${totalAmount}, 'pending_approval')
      RETURNING *
    `

    const batchId = batch[0].id as string

    // Insert payment records
    for (const p of validPayments) {
      await sql`
        INSERT INTO payments (batch_id, recipient_name, phone_number, amount, status)
        VALUES (${batchId}, ${p.recipient_name}, ${p.phone_number}, ${p.amount}, 'pending')
        ON CONFLICT (batch_id, phone_number) DO NOTHING
      `
    }

    return NextResponse.json({
      success: true,
      batch_id: batchId,
      total_recipients: validPayments.length,
      total_amount: totalAmount,
      validation_errors: errors,
      duplicates_in_file: duplicates,
      recent_successful_payments: recentPhones,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
