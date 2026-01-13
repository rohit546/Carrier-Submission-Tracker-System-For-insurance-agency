-- Migration: Add lob column to carrier_quotes table
-- Date: 2026-01-13
-- Description: Adds Line of Business (LOB) field to carrier quotes

-- Add lob column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'carrier_quotes' 
    AND column_name = 'lob'
  ) THEN
    ALTER TABLE carrier_quotes ADD COLUMN lob VARCHAR(255);
  END IF;
END $$;
