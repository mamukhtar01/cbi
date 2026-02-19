import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql as getSQL } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const sql = getSQL()

    // Today's stats
    const todayStats = await sql`
      SELECT
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'pending' OR status = 'processing') as in_progress,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as total_sent,
        COALESCE(SUM(amount), 0) as total_amount
      FROM payments
      WHERE DATE(created_at) = CURRENT_DATE
    `

    // All-time stats
    const allTimeStats = await sql`
      SELECT
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as total_sent
      FROM payments
    `

    // Recent batches
    const recentBatches = await sql`
      SELECT b.*,
        COUNT(p.id) as payment_count,
        COUNT(p.id) FILTER (WHERE p.status = 'success') as success_count,
        COUNT(p.id) FILTER (WHERE p.status = 'failed') as failed_count
      FROM upload_batches b
      LEFT JOIN payments p ON p.batch_id = b.id
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `

    const totalToday = parseInt(todayStats[0].total_payments as string) || 0
    const successfulToday = parseInt(todayStats[0].successful as string) || 0

    return NextResponse.json({
      today: {
        ...todayStats[0],
        success_rate: totalToday > 0 ? Math.round((successfulToday / totalToday) * 100) : 0,
      },
      all_time: allTimeStats[0],
      recent_batches: recentBatches,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
