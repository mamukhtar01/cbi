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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "25")
    const offset = (page - 1) * limit

    // Build dynamic query with filters
    let payments
    let countResult

    if (status && search && dateFrom && dateTo) {
      payments = await sql`
        SELECT p.*, b.file_name FROM payments p
        JOIN upload_batches b ON p.batch_id = b.id
        WHERE p.status = ${status}
          AND (p.recipient_name ILIKE ${"%" + search + "%"} OR p.phone_number ILIKE ${"%" + search + "%"})
          AND p.created_at >= ${dateFrom}::timestamptz
          AND p.created_at <= ${dateTo}::timestamptz
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM payments p
        WHERE p.status = ${status}
          AND (p.recipient_name ILIKE ${"%" + search + "%"} OR p.phone_number ILIKE ${"%" + search + "%"})
          AND p.created_at >= ${dateFrom}::timestamptz
          AND p.created_at <= ${dateTo}::timestamptz
      `
    } else if (status && search) {
      payments = await sql`
        SELECT p.*, b.file_name FROM payments p
        JOIN upload_batches b ON p.batch_id = b.id
        WHERE p.status = ${status}
          AND (p.recipient_name ILIKE ${"%" + search + "%"} OR p.phone_number ILIKE ${"%" + search + "%"})
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM payments p
        WHERE p.status = ${status}
          AND (p.recipient_name ILIKE ${"%" + search + "%"} OR p.phone_number ILIKE ${"%" + search + "%"})
      `
    } else if (status && dateFrom && dateTo) {
      payments = await sql`
        SELECT p.*, b.file_name FROM payments p
        JOIN upload_batches b ON p.batch_id = b.id
        WHERE p.status = ${status}
          AND p.created_at >= ${dateFrom}::timestamptz
          AND p.created_at <= ${dateTo}::timestamptz
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM payments p
        WHERE p.status = ${status}
          AND p.created_at >= ${dateFrom}::timestamptz
          AND p.created_at <= ${dateTo}::timestamptz
      `
    } else if (search && dateFrom && dateTo) {
      payments = await sql`
        SELECT p.*, b.file_name FROM payments p
        JOIN upload_batches b ON p.batch_id = b.id
        WHERE (p.recipient_name ILIKE ${"%" + search + "%"} OR p.phone_number ILIKE ${"%" + search + "%"})
          AND p.created_at >= ${dateFrom}::timestamptz
          AND p.created_at <= ${dateTo}::timestamptz
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM payments p
        WHERE (p.recipient_name ILIKE ${"%" + search + "%"} OR p.phone_number ILIKE ${"%" + search + "%"})
          AND p.created_at >= ${dateFrom}::timestamptz
          AND p.created_at <= ${dateTo}::timestamptz
      `
    } else if (status) {
      payments = await sql`
        SELECT p.*, b.file_name FROM payments p
        JOIN upload_batches b ON p.batch_id = b.id
        WHERE p.status = ${status}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM payments p WHERE p.status = ${status}
      `
    } else if (search) {
      payments = await sql`
        SELECT p.*, b.file_name FROM payments p
        JOIN upload_batches b ON p.batch_id = b.id
        WHERE (p.recipient_name ILIKE ${"%" + search + "%"} OR p.phone_number ILIKE ${"%" + search + "%"})
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM payments p
        WHERE (p.recipient_name ILIKE ${"%" + search + "%"} OR p.phone_number ILIKE ${"%" + search + "%"})
      `
    } else if (dateFrom && dateTo) {
      payments = await sql`
        SELECT p.*, b.file_name FROM payments p
        JOIN upload_batches b ON p.batch_id = b.id
        WHERE p.created_at >= ${dateFrom}::timestamptz
          AND p.created_at <= ${dateTo}::timestamptz
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM payments p
        WHERE p.created_at >= ${dateFrom}::timestamptz
          AND p.created_at <= ${dateTo}::timestamptz
      `
    } else {
      payments = await sql`
        SELECT p.*, b.file_name FROM payments p
        JOIN upload_batches b ON p.batch_id = b.id
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`SELECT COUNT(*) as total FROM payments`
    }

    // Summary stats
    const stats = await sql`
      SELECT
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as total_sent,
        COALESCE(SUM(amount), 0) as total_amount
      FROM payments
    `

    // Daily stats for chart (last 30 days)
    const dailyStats = await sql`
      SELECT
        DATE(created_at) as date,
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as amount_sent
      FROM payments
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `

    return NextResponse.json({
      payments,
      total: parseInt(countResult[0].total as string),
      page,
      limit,
      stats: stats[0],
      daily_stats: dailyStats,
    })
  } catch (error) {
    console.error("Reports error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
