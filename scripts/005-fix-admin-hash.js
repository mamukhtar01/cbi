import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function fixAdmin() {
  const hash = await bcrypt.hash("changeme123", 10)
  console.log("[v0] New hash:", hash)

  // Verify locally
  const valid = await bcrypt.compare("changeme123", hash)
  console.log("[v0] Local verification:", valid)

  // Update in database
  await sql`UPDATE admin_users SET password_hash = ${hash} WHERE username = 'admin'`
  console.log("[v0] Updated admin password hash in database")

  // Verify from database
  const rows = await sql`SELECT password_hash FROM admin_users WHERE username = 'admin'`
  const dbHash = rows[0].password_hash
  const dbValid = await bcrypt.compare("changeme123", dbHash)
  console.log("[v0] DB verification:", dbValid)
}

fixAdmin().catch(console.error)
