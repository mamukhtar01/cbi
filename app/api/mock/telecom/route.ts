import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { phone_number, amount, reference } = await request.json()

    if (!phone_number || !amount || !reference) {
      return NextResponse.json(
        { success: false, transaction_id: null, message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Simulate processing delay (1-3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Simulate ~90% success rate
    const success = Math.random() < 0.9

    if (success) {
      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      return NextResponse.json({
        success: true,
        transaction_id: transactionId,
        message: `Payment of ${amount} sent to ${phone_number} successfully`,
      })
    } else {
      const errors = [
        "Insufficient balance in disbursement account",
        "Recipient phone number not registered for mobile money",
        "Network timeout - please retry",
        "Daily transaction limit exceeded for recipient",
      ]
      return NextResponse.json({
        success: false,
        transaction_id: null,
        message: errors[Math.floor(Math.random() * errors.length)],
      })
    }
  } catch {
    return NextResponse.json(
      { success: false, transaction_id: null, message: "Internal server error" },
      { status: 500 }
    )
  }
}
