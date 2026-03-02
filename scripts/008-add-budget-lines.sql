-- Create budget_lines table
CREATE TABLE IF NOT EXISTS budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_line_code VARCHAR(100) NOT NULL UNIQUE,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  project_name VARCHAR(255) NOT NULL,
  approver VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add budget_line_id to upload_batches
ALTER TABLE upload_batches
  ADD COLUMN IF NOT EXISTS budget_line_id UUID REFERENCES budget_lines(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_budget_lines_code ON budget_lines (budget_line_code);
CREATE INDEX IF NOT EXISTS idx_upload_batches_budget_line_id ON upload_batches (budget_line_id);
