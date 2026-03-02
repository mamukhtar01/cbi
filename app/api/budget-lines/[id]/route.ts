import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql as getSQL } from "@/lib/db"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Budget line id is required" }, { status: 400 })
    }

    const sql = getSQL()

    const existing = await sql`SELECT id FROM budget_lines WHERE id = ${id}`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Budget line not found" }, { status: 404 })
    }

    await sql`DELETE FROM budget_lines WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Budget lines DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
