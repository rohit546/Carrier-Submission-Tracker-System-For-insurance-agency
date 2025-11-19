-- Migration: Add API Keys Table for Eform Integration
-- This allows admins to create and manage API keys for eform access

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL, -- Description/name for the key (e.g., "Eform Production", "Eform Staging")
  key_hash VARCHAR(255) UNIQUE NOT NULL, -- Hashed version of the API key
  key_prefix VARCHAR(10) NOT NULL, -- First 8 chars for display (e.g., "csk_abc1")
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP, -- Optional expiration
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- Add trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at 
  BEFORE UPDATE ON api_keys
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

