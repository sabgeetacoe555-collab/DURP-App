-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable the http extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS http;

-- Schedule the session reminders cron job to run every 5 minutes
-- This will call the session-reminders edge function
SELECT cron.schedule(
  'session-reminders', 
  '*/5 * * * *', 
  $$
  SELECT net.http_post(
    url:='https://feetcenkvxrmfltorlru.supabase.co/functions/v1/session-reminders',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZXRjZW5rdnhybWZsdG9ybHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTcwNDcsImV4cCI6MjA2NzEzMzA0N30.h24ceWNugBgTza_L8loJpQiuyBYdkjSBHCRMTRVgh_U"}'
  ) as request_id;
  $$
);
