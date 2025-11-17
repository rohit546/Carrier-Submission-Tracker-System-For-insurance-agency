-- Migration: Add 'submitted' status to submissions table
-- Run this in Neon SQL Editor if you already created the table

ALTER TABLE submissions 
DROP CONSTRAINT IF EXISTS submissions_status_check;

ALTER TABLE submissions 
ADD CONSTRAINT submissions_status_check 
CHECK (status IN ('draft', 'quoted', 'bound', 'submitted'));
