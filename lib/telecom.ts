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

export type PaymentProvider = "mock" | "mtn_momo" | "mpesa"

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000"
  )
}

async function callMockEndpoint(
  endpoint: string,
  request: PaymentRequest,
): Promise<PaymentResponse> {
  const baseUrl = getBaseUrl().replace(/\/$/, "")
  const res = await fetch(`${baseUrl}${endpoint}`, {
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

/**
 * Send mobile money payment via the default mock telecom endpoint.
 */
async function sendMockPayment(request: PaymentRequest): Promise<PaymentResponse> {
  return callMockEndpoint("/api/mock/telecom", request)
}

/**
 * MTN Mobile Money stub – real integration not yet configured.
 */
async function sendMtnMomoPayment(_request: PaymentRequest): Promise<PaymentResponse> {
  return {
    success: false,
    transaction_id: null,
    message: "provider not configured: mtn_momo",
  }
}

/**
 * M-Pesa stub – real integration not yet configured.
 */
async function sendMpesaPayment(request: PaymentRequest): Promise<PaymentResponse> {
  return callMockEndpoint("/api/mock/mpesa", request)
}

/**
 * Dispatch a payment to the selected provider.
 * Use sendPayment(provider, request) instead of the old sendMobilePayment().
 */
export async function sendPayment(
  provider: PaymentProvider | string,
  request: PaymentRequest,
): Promise<PaymentResponse> {
  switch (provider) {
    case "mtn_momo":
      return sendMtnMomoPayment(request)
    case "mpesa":
      return sendMpesaPayment(request)
    case "mock":
    default:
      return sendMockPayment(request)
  }
}

/**
 * @deprecated Use sendPayment(provider, request) instead.
 */
export async function sendMobilePayment(request: PaymentRequest): Promise<PaymentResponse> {
  return sendMockPayment(request)
}
