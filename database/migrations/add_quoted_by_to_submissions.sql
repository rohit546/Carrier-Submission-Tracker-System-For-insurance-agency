-- Migration: Add quoted_by column to submissions table
-- This column stores the name of the person who quoted the submission

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS quoted_by VARCHAR(255);

-- Add index for better query performance if needed
CREATE INDEX IF NOT EXISTS idx_submissions_quoted_by ON submissions(quoted_by);
