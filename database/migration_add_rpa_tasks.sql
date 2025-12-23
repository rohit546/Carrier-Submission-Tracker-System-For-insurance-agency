-- Add rpa_tasks column to submissions table
-- Stores RPA automation status for each carrier

ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS rpa_tasks JSONB DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN submissions.rpa_tasks IS 'Stores RPA automation task status: { carrier: { task_id, status, submitted_at, completed_at, result/error } }';

