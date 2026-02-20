export interface WavePaymentResult {
  success: boolean;
  waveRef?: string;
  message: string;
}

export async function pushToWave(
  phone: string,
  amount: number,
  reference: string
): Promise<WavePaymentResult> {
  const failRate = parseFloat(process.env.WAVE_FAIL_RATE ?? '0.1');
  const rand = Math.random();

  void phone;
  void amount;

  if (rand < failRate) {
    return {
      success: false,
      message: `Wave push failed for reference ${reference}`,
    };
  }

  const waveRef = `WAVE-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    success: true,
    waveRef,
    message: `Wave push successful for ${phone}`,
  };
}
