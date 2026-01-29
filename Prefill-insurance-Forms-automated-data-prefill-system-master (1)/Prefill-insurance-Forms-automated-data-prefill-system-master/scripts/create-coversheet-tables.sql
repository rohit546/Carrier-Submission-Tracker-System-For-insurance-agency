-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create insured_information table
CREATE TABLE IF NOT EXISTS insured_information (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  
  -- Security (JSONB)
  alarm_info JSONB DEFAULT '{}'::jsonb,
  fire_info JSONB DEFAULT '{}'::jsonb,
  
  -- Coverage (JSONB)
  property_coverage JSONB DEFAULT '{}'::jsonb,
  general_liability JSONB DEFAULT '{}'::jsonb,
  workers_compensation JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  source VARCHAR(50) DEFAULT 'eform',
  eform_submission_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name VARCHAR(255) NOT NULL,
  business_type_id UUID,
  agent_id UUID,
  status VARCHAR(50) DEFAULT 'draft',
  insured_info_id UUID REFERENCES insured_information(id),
  insured_info_snapshot JSONB,
  source VARCHAR(50) DEFAULT 'eform',
  eform_submission_id UUID,
  public_access_token UUID UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_insured_info_unique_identifier ON insured_information(unique_identifier);
CREATE INDEX IF NOT EXISTS idx_insured_info_corporation_name ON insured_information(corporation_name);
CREATE INDEX IF NOT EXISTS idx_insured_info_eform_submission_id ON insured_information(eform_submission_id);
CREATE INDEX IF NOT EXISTS idx_submissions_business_name ON submissions(business_name);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_insured_info_id ON submissions(insured_info_id);
CREATE INDEX IF NOT EXISTS idx_submissions_public_access_token ON submissions(public_access_token);
CREATE INDEX IF NOT EXISTS idx_submissions_eform_submission_id ON submissions(eform_submission_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at automatically
DROP TRIGGER IF EXISTS update_insured_information_updated_at ON insured_information;
CREATE TRIGGER update_insured_information_updated_at
    BEFORE UPDATE ON insured_information
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

