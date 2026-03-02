import { cookies } from "next/headers"
import { sql as getSQL } from "./db"
import bcrypt from "bcryptjs"
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

const SESSION_COOKIE = "session_token"
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours

const globalForSession = globalThis as { __sessionSecret?: string }

interface SessionPayload {
  userId: number
  username: string
  issuedAt: number
  expiresAt: number
  sessionId: string
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET
  if (secret) return secret

  if (process.env.NODE_ENV !== "production") {
    if (!globalForSession.__sessionSecret) {
      globalForSession.__sessionSecret = randomBytes(32).toString("hex")
    }
    return globalForSession.__sessionSecret
  }

  throw new Error("SESSION_SECRET (or NEXTAUTH_SECRET) is not configured")
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url")
}

function signPayload(encodedPayload: string): string {
  const secret = getSessionSecret()
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url")
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function createSessionToken(payload: SessionPayload): string {
  const encoded = encodePayload(payload)
  const signature = signPayload(encoded)
  return `${encoded}.${signature}`
}

function decodeSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null
  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) return null

  const expectedSignature = signPayload(encodedPayload)
  if (!safeEqual(signature, expectedSignature)) return null

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export async function login(username: string, password: string) {
  const sql = getSQL()
  const users = await sql`SELECT * FROM admin_users WHERE username = ${username}`
  console.log("User query result:", users) // Debug log
  if (users.length === 0) return null

  const user = users[0]
  const valid = await bcrypt.compare(password, user.password_hash)
  console.log("Password valid:", valid) // Debug log
  if (!valid) return null

  const payload: SessionPayload = {
    userId: user.id as number,
    username: user.username as string,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
    sessionId: randomBytes(16).toString("hex"),
  }

  const token = createSessionToken(payload)

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
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  const payload = decodeSessionToken(token)

  if (!payload) {
    if (token) {
      cookieStore.delete(SESSION_COOKIE)
    }
    return null
  }

  return { userId: payload.userId, username: payload.username }
}
