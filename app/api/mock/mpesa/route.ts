import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { phone_number, amount, reference } = await request.json()

    if (!phone_number || !amount || !reference) {
      return NextResponse.json(
        { success: false, transaction_id: null, message: "Missing required fields" },
        { status: 400 },
      )
    }

    // Simulate M-Pesa network latency between 1–2 seconds
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

    // Simulate ~92% success rate for Mpesa
    const success = Math.random() < 0.92

    if (success) {
      const transactionId = `MPESA${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      return NextResponse.json({
        success: true,
        transaction_id: transactionId,
        message: `M-Pesa payment of ${amount} sent to ${phone_number}`,
      })
    }

    const errors = [
      "M-Pesa: recipient is not registered",
      "M-Pesa: insufficient funds",
      "M-Pesa gateway timeout",
    ]

    return NextResponse.json({
      success: false,
      transaction_id: null,
      message: errors[Math.floor(Math.random() * errors.length)],
    })
  } catch {
    return NextResponse.json(
      { success: false, transaction_id: null, message: "Internal server error" },
      { status: 500 },
    )
  }
}
