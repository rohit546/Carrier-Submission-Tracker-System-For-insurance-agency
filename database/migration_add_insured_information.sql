-- Migration: Add Insured Information Table and Update Submissions
-- This enables eform integration with insured-centric data model

-- Step 1: Create insured_information table
CREATE TABLE IF NOT EXISTS insured_information (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Unique identifier to prevent duplicates (corporation name + address hash)
  unique_identifier VARCHAR(255) UNIQUE,
  
  -- Ownership & Basic Info
  ownership_type VARCHAR(50),
  corporation_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  contact_number VARCHAR(50),
  contact_email VARCHAR(255),
  lead_source VARCHAR(255),
  proposed_effective_date DATE,
  prior_carrier VARCHAR(255),
  target_premium DECIMAL(10, 2),
  
  -- Business Structure
  applicant_is VARCHAR(50),
  operation_description TEXT,
  dba VARCHAR(255),
  address TEXT,
  
  -- Property Details
  hours_of_operation VARCHAR(50),
  no_of_mpos INTEGER,
  construction_type VARCHAR(100),
  years_exp_in_business INTEGER,
  years_at_location INTEGER,
  year_built INTEGER,
  year_latest_update INTEGER,
  total_sq_footage INTEGER,
  leased_out_space VARCHAR(10),
  protection_class VARCHAR(50),
  additional_insured TEXT,
  
  -- Security (JSONB for flexibility)
  alarm_info JSONB DEFAULT '{}'::jsonb,
  fire_info JSONB DEFAULT '{}'::jsonb,
  
  -- Coverage (JSONB for complex nested structures)
  property_coverage JSONB DEFAULT '{}'::jsonb,
  general_liability JSONB DEFAULT '{}'::jsonb,
  workers_compensation JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'eform', 'ghl'
  eform_submission_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Update submissions table
ALTER TABLE submissions 
  ADD COLUMN IF NOT EXISTS insured_info_id UUID REFERENCES insured_information(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS insured_info_snapshot JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS eform_submission_id UUID,
  ADD COLUMN IF NOT EXISTS public_access_token UUID UNIQUE; -- For no-auth access

-- Step 3: Make business_type_id nullable (for eform submissions)
ALTER TABLE submissions 
  ALTER COLUMN business_type_id DROP NOT NULL;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_insured_info_corporation ON insured_information(corporation_name);
CREATE INDEX IF NOT EXISTS idx_insured_info_unique_id ON insured_information(unique_identifier);
CREATE INDEX IF NOT EXISTS idx_insured_info_source ON insured_information(source);
CREATE INDEX IF NOT EXISTS idx_insured_info_created ON insured_information(created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_insured_info ON submissions(insured_info_id);
CREATE INDEX IF NOT EXISTS idx_submissions_public_token ON submissions(public_access_token);
CREATE INDEX IF NOT EXISTS idx_submissions_source ON submissions(source);

-- Step 5: Add trigger for updated_at
CREATE TRIGGER update_insured_information_updated_at 
  BEFORE UPDATE ON insured_information
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Future table for summaries (prepared for future use)
CREATE TABLE IF NOT EXISTS insured_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insured_info_id UUID NOT NULL REFERENCES insured_information(id) ON DELETE CASCADE,
  summary_data JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_summaries_insured_info ON insured_summaries(insured_info_id);

CREATE TRIGGER update_insured_summaries_updated_at 
  BEFORE UPDATE ON insured_summaries
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

