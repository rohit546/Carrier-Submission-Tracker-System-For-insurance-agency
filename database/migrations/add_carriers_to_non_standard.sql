-- Add carriers column to non_standard_submissions table
ALTER TABLE non_standard_submissions 
ADD COLUMN IF NOT EXISTS carriers JSONB DEFAULT '[]'::jsonb;

-- Update existing records to populate carriers from to_emails
-- This creates a carrier entry for each email in to_emails with a default company name
UPDATE non_standard_submissions
SET carriers = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'email', email,
      'company', 'Custom'
    )
  )
  FROM unnest(to_emails) AS email
)
WHERE carriers = '[]'::jsonb OR carriers IS NULL;
