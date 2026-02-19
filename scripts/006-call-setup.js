// This script calls the setup endpoint to seed the admin user with a proper bcrypt hash
const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000"

async function callSetup() {
  console.log(`Calling setup endpoint at ${BASE_URL}/api/auth/setup`)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/setup`, { method: "POST" })
    const data = await res.json()
    console.log("Response:", JSON.stringify(data, null, 2))
  } catch (err) {
    console.error("Error calling setup:", err.message)
  }
}

callSetup()
