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
    const budgetLines = await sql`
      SELECT id, budget_line_code, amount, project_name, approver, created_at
      FROM budget_lines
      ORDER BY created_at DESC
    `

    return NextResponse.json({ budget_lines: budgetLines })
  } catch (error) {
    console.error("Budget lines GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const sql = getSQL()
    const body = await request.json()
    const { budget_line_code, amount, project_name, approver } = body as {
      budget_line_code: string
      amount: number
      project_name: string
      approver: string
    }

    if (!budget_line_code || !budget_line_code.trim()) {
      return NextResponse.json({ error: "Budget line code is required" }, { status: 400 })
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 })
    }
    if (!project_name || !project_name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }
    if (!approver || !approver.trim()) {
      return NextResponse.json({ error: "Approver is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO budget_lines (budget_line_code, amount, project_name, approver)
      VALUES (${budget_line_code.trim()}, ${Number(amount)}, ${project_name.trim()}, ${approver.trim()})
      RETURNING id, budget_line_code, amount, project_name, approver, created_at
    `

    return NextResponse.json({ success: true, budget_line: result[0] }, { status: 201 })
  } catch (error: unknown) {
    console.error("Budget lines POST error:", error)
    const pgError = error as { code?: string }
    if (pgError?.code === "23505") {
      return NextResponse.json({ error: "Budget line code already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
