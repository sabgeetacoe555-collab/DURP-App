-- Fix NCPA universities schema issues
-- This migration fixes the data type mismatch for the points field

-- Change points field from INTEGER to DECIMAL to handle decimal values from API
ALTER TABLE ncpa_universities 
ALTER COLUMN points TYPE DECIMAL(10,6);

-- Add a comment explaining the change
COMMENT ON COLUMN ncpa_universities.points IS 
'University points from NCPA API. Changed from INTEGER to DECIMAL to handle decimal values like 89.81708606867342.';
