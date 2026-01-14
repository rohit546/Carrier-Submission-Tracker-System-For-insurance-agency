-- McKinney & Co Submission Tracker Database Schema
-- Designed for RAG pipeline integration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'agent')),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Business types table
CREATE TABLE IF NOT EXISTS business_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Carriers table
CREATE TABLE IF NOT EXISTS carriers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Carrier appetite table (with detailed playbook data for RAG)
CREATE TABLE IF NOT EXISTS carrier_appetite (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  
  -- Detailed playbook information (for RAG pipeline)
  playbook_data JSONB DEFAULT '{}'::jsonb,
  
  -- Quick access fields (denormalized for performance)
  geographic_restrictions TEXT[] DEFAULT ARRAY[]::TEXT[],
  exclusions TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) DEFAULT 'active', -- active, no_appetite, limited, unresponsive
  coverage_details JSONB DEFAULT '{}'::jsonb,
  operational_criteria JSONB DEFAULT '{}'::jsonb,
  contact_info JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- One appetite record per carrier-business_type combination
  UNIQUE(carrier_id, business_type_id)
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name VARCHAR(255) NOT NULL,
  business_type_id UUID NOT NULL REFERENCES business_types(id),
  agent_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'quoted', 'bound', 'submitted')),
  quoted_by VARCHAR(255),
  carriers_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Carrier quotes table (normalized for better querying)
CREATE TABLE IF NOT EXISTS carrier_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES carriers(id),
  quoted BOOLEAN DEFAULT FALSE,
  lob VARCHAR(255),
  amount DECIMAL(10, 2),
  remarks TEXT DEFAULT '',
  selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(submission_id, carrier_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_carrier_appetite_carrier ON carrier_appetite(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_appetite_business_type ON carrier_appetite(business_type_id);
CREATE INDEX IF NOT EXISTS idx_carrier_appetite_status ON carrier_appetite(status);
CREATE INDEX IF NOT EXISTS idx_carrier_appetite_playbook ON carrier_appetite USING GIN (playbook_data);
CREATE INDEX IF NOT EXISTS idx_submissions_agent ON submissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_submissions_business_type ON submissions(business_type_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_carrier_quotes_submission ON carrier_quotes(submission_id);
CREATE INDEX IF NOT EXISTS idx_carrier_quotes_carrier ON carrier_quotes(carrier_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_types_updated_at BEFORE UPDATE ON business_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carriers_updated_at BEFORE UPDATE ON carriers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carrier_appetite_updated_at BEFORE UPDATE ON carrier_appetite
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carrier_quotes_updated_at BEFORE UPDATE ON carrier_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
