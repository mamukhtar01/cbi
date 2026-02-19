import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql as getSQL } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const sql = getSQL()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")

    let payments
    if (status && dateFrom && dateTo) {
      payments = await sql`
        SELECT p.recipient_name, p.phone_number, p.amount, p.status, p.transaction_id, p.error_message, p.created_at, p.processed_at, b.file_name
        FROM payments p JOIN upload_batches b ON p.batch_id = b.id
        WHERE p.status = ${status} AND p.created_at >= ${dateFrom}::timestamptz AND p.created_at <= ${dateTo}::timestamptz
        ORDER BY p.created_at DESC
      `
    } else if (status) {
      payments = await sql`
        SELECT p.recipient_name, p.phone_number, p.amount, p.status, p.transaction_id, p.error_message, p.created_at, p.processed_at, b.file_name
        FROM payments p JOIN upload_batches b ON p.batch_id = b.id
        WHERE p.status = ${status}
        ORDER BY p.created_at DESC
      `
    } else if (search) {
      payments = await sql`
        SELECT p.recipient_name, p.phone_number, p.amount, p.status, p.transaction_id, p.error_message, p.created_at, p.processed_at, b.file_name
        FROM payments p JOIN upload_batches b ON p.batch_id = b.id
        WHERE p.recipient_name ILIKE ${"%" + search + "%"} OR p.phone_number ILIKE ${"%" + search + "%"}
        ORDER BY p.created_at DESC
      `
    } else {
      payments = await sql`
        SELECT p.recipient_name, p.phone_number, p.amount, p.status, p.transaction_id, p.error_message, p.created_at, p.processed_at, b.file_name
        FROM payments p JOIN upload_batches b ON p.batch_id = b.id
        ORDER BY p.created_at DESC
      `
    }

    // Generate CSV
    const headers = ["Name", "Phone", "Amount", "Status", "Transaction ID", "Error", "File", "Created", "Processed"]
    const rows = payments.map((p) => [
      p.recipient_name,
      p.phone_number,
      p.amount,
      p.status,
      p.transaction_id || "",
      p.error_message || "",
      p.file_name,
      p.created_at,
      p.processed_at || "",
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="payments-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
