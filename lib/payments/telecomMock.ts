export type TelecomStatus = 'SUCCESS' | 'FAILED' | 'DELAYED';

export interface TelecomResponse {
  status: TelecomStatus;
  reference: string;
  message: string;
}

export async function sendPaymentToTelecom(
  phone: string,
  amount: number
): Promise<TelecomResponse> {
  const failRate = parseFloat(process.env.TELECOM_FAIL_RATE ?? '0.1');
  const delayRate = parseFloat(process.env.TELECOM_DELAY_RATE ?? '0.1');
  const rand = Math.random();
  const reference = `TEL-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Suppress unused parameter warnings
  void phone;
  void amount;

  if (rand < failRate) {
    return { status: 'FAILED', reference, message: 'Telecom payment failed' };
  }
  if (rand < failRate + delayRate) {
    return {
      status: 'DELAYED',
      reference,
      message: 'Telecom payment delayed',
    };
  }
  return { status: 'SUCCESS', reference, message: 'Payment successful' };
}
