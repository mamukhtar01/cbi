import { cookies } from "next/headers"
import { sql as getSQL } from "./db"
import bcrypt from "bcryptjs"

const SESSION_COOKIE = "session_token"
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Simple in-memory session store (in production, use Redis or DB)
const sessions = new Map<string, { userId: number; username: string; expiresAt: number }>()

export async function login(username: string, password: string) {
  const sql = getSQL()
  const users = await sql`SELECT * FROM admin_users WHERE username = ${username}`
  console.log("User query result:", users) // Debug log
  if (users.length === 0) return null

  const user = users[0]
  const valid = await bcrypt.compare(password, user.password_hash)
  console.log("Password valid:", valid) // Debug log
  if (!valid) return null

  const token = generateToken()
  sessions.set(token, {
    userId: user.id as number,
    username: user.username as string,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  })

  return { userId: user.id, username: user.username }
}

export async function logout() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    sessions.delete(token)
  }
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = sessions.get(token)
  if (!session) return null

  if (Date.now() > session.expiresAt) {
    sessions.delete(token)
    return null
  }

  return session
}
