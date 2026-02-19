export interface PaymentRequest {
  phone_number: string
  amount: number
  reference: string
}

export interface PaymentResponse {
  success: boolean
  transaction_id: string | null
  message: string
}

/**
 * Send mobile money payment via telecom API.
 * Currently uses mock API; swap this function body for real M-Pesa/MTN MoMo integration.
 */
export async function sendMobilePayment(request: PaymentRequest): Promise<PaymentResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const res = await fetch(`${baseUrl}/api/mock/telecom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    return {
      success: false,
      transaction_id: null,
      message: `API error: ${res.status}`,
    }
  }

  return res.json()
}
