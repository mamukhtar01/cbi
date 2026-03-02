-- Add approval and payment provider columns to upload_batches
ALTER TABLE upload_batches
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'mock';

-- Change default status for new batches to pending_approval
ALTER TABLE upload_batches
  ALTER COLUMN status SET DEFAULT 'pending_approval';

-- Add payment_provider column to payments
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'mock';
