import { NextResponse } from "next/server"
import { sql as getSQL } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST() {
  try {
    const sql = getSQL()
    const password = "changeme123"
    const hash = await bcrypt.hash(password, 10)

    // Upsert admin user with a properly hashed password
    await sql`
      INSERT INTO admin_users (username, password_hash)
      VALUES ('admin', ${hash})
      ON CONFLICT (username)
      DO UPDATE SET password_hash = ${hash}
    `

    // Verify it worked
    const users = await sql`SELECT username, password_hash FROM admin_users WHERE username = 'admin'`
    if (users.length === 0) {
      return NextResponse.json({ error: "Failed to create admin user" }, { status: 500 })
    }

    const valid = await bcrypt.compare(password, users[0].password_hash)

    return NextResponse.json({
      success: true,
      message: "Admin user created/updated",
      verified: valid,
    })
  } catch (err) {
    console.error("[v0] Setup error:", err)
    return NextResponse.json({ error: "Setup failed", details: String(err) }, { status: 500 })
  }
}
