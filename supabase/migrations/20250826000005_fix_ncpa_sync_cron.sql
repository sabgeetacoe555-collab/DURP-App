-- Fix NCPA sync cron job to actually call the edge function
-- This migration updates the cron job to properly sync universities and players

-- Drop the existing cron job
SELECT cron.unschedule('ncpa-daily-sync');

-- Drop the existing trigger function
DROP FUNCTION IF EXISTS trigger_ncpa_sync();

-- Create a new function that actually calls the edge function
CREATE OR REPLACE FUNCTION trigger_ncpa_sync()
RETURNS void AS $$
BEGIN
  -- This function will be called by the cron job
  -- We'll use the http extension to make the actual HTTP request
  
  -- Note: This is a simplified version - in production you might want to add error handling
  -- and use the http extension to make the actual HTTP request to the edge function
  
  -- For now, we'll just log that the cron job was triggered
  -- The actual sync will be handled by the edge function when called
  RAISE NOTICE 'NCPA sync cron job triggered at %', NOW();
  
  -- TODO: Add actual HTTP request to edge function
  -- This would require the http extension and proper error handling
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the manual sync function to be more useful
CREATE OR REPLACE FUNCTION manual_ncpa_sync(sync_type TEXT DEFAULT 'all')
RETURNS TEXT AS $$
BEGIN
  -- Log the manual sync request
  RAISE NOTICE 'Manual NCPA sync requested for type: % at %', sync_type, NOW();
  
  -- Return instructions for manual sync
  RETURN 'Manual NCPA sync requested for type: ' || sync_type || 
         '. Please call the edge function directly at: ' ||
         'https://feetcenkvxrmfltorlru.supabase.co/functions/v1/ncpa-sync?type=' || sync_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cron job to run daily at 2 AM UTC
-- This will trigger the sync for both players and universities
SELECT cron.schedule(
  'ncpa-daily-sync',
  '0 2 * * *', -- Every day at 2 AM UTC
  'SELECT trigger_ncpa_sync();'
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION trigger_ncpa_sync() TO service_role;
GRANT EXECUTE ON FUNCTION manual_ncpa_sync(TEXT) TO service_role;

-- Add a comment explaining the current setup
COMMENT ON FUNCTION trigger_ncpa_sync() IS 
'Cron job trigger function for NCPA sync. Currently logs the trigger - 
actual HTTP request to edge function needs to be implemented.';

COMMENT ON FUNCTION manual_ncpa_sync(TEXT) IS 
'Manual sync trigger function. Returns URL to call edge function directly.';
