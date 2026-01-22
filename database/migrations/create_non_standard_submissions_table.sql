-- Create non_standard_submissions table for tracking email submissions to non-standard carriers
CREATE TABLE IF NOT EXISTS non_standard_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  
  -- Email Details
  from_email VARCHAR(255) NOT NULL,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Status
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN (
    'sent',      -- Email sent
    'responded', -- Carrier responded
    'quoted',    -- Quote received
    'declined',  -- Declined
    'bound'      -- Policy bound
  )),
  
  -- Carriers (stored as JSONB array with name and email for each recipient)
  carriers JSONB DEFAULT '[]'::jsonb,
  
  -- Quotes (stored as JSONB array)
  quotes JSONB DEFAULT '[]'::jsonb,
  
  -- Followups (stored as JSONB array)
  followups JSONB DEFAULT '[]'::jsonb,
  
  -- Last Activity
  last_activity_at TIMESTAMP,
  last_activity_type VARCHAR(50),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_non_standard_submission_id ON non_standard_submissions(submission_id);
CREATE INDEX IF NOT EXISTS idx_non_standard_status ON non_standard_submissions(status);
CREATE INDEX IF NOT EXISTS idx_non_standard_sent_at ON non_standard_submissions(sent_at);

-- Trigger for updated_at
CREATE TRIGGER update_non_standard_submissions_updated_at BEFORE UPDATE ON non_standard_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
