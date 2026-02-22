export type TelecomStatus = 'SUCCESS' | 'FAILED' | 'DELAYED';

export interface TelecomResponse {
  status: TelecomStatus;
  reference: string;
  message: string;
}

export async function sendPaymentToTelecom(
  _phone: string,
  _amount: number
): Promise<TelecomResponse> {
  const failRate = parseFloat(process.env.TELECOM_FAIL_RATE ?? '10') / 100;
  const delayRate = parseFloat(process.env.TELECOM_DELAY_RATE ?? '10') / 100;
  const rand = Math.random();
  const reference = `TEL-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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
