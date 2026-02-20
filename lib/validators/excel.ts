import * as XLSX from 'xlsx';
import { isValidE164 } from './phone';

export interface BeneficiaryRow {
  name: string;
  phone: string;
  address?: string;
}

export interface ExcelValidationResult {
  valid: BeneficiaryRow[];
  errors: { row: number; message: string }[];
}

export function parseAndValidateExcel(buffer: Buffer): ExcelValidationResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const valid: BeneficiaryRow[] = [];
  const errors: { row: number; message: string }[] = [];
  const seenPhones = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const name = String(row['name'] ?? row['Name'] ?? '').trim();
    const phone = String(row['phone'] ?? row['Phone'] ?? '').trim();
    const address = row['address'] ?? row['Address'];

    if (!name) {
      errors.push({ row: rowNum, message: 'Missing name' });
      return;
    }
    if (!phone) {
      errors.push({ row: rowNum, message: 'Missing phone' });
      return;
    }
    if (!isValidE164(phone)) {
      errors.push({
        row: rowNum,
        message: `Invalid E.164 phone number: ${phone}`,
      });
      return;
    }
    if (seenPhones.has(phone)) {
      errors.push({
        row: rowNum,
        message: `Duplicate phone number in file: ${phone}`,
      });
      return;
    }
    seenPhones.add(phone);
    valid.push({ name, phone, address: address ? String(address) : undefined });
  });

  return { valid, errors };
}
