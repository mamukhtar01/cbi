const E164_REGEX = /^\+[1-9]\d{1,14}$/;

export function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone);
}

export function validatePhone(phone: string): string {
  if (!isValidE164(phone)) {
    throw new Error(
      `Phone number "${phone}" is not valid E.164 format (e.g. +25070000000)`
    );
  }
  return phone;
}
