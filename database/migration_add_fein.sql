-- Migration: Add FEIN (Federal Employer Identification Number) column to insured_information table

-- Add FEIN column
ALTER TABLE insured_information 
  ADD COLUMN IF NOT EXISTS fein VARCHAR(50);

-- Add index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_insured_info_fein ON insured_information(fein) WHERE fein IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN insured_information.fein IS 'Federal Employer Identification Number (9-digit, format: XX-XXXXXXX)';

