-- Optimize session table for spatial queries and prepare for friends functionality
-- Focus on current distance/radius performance with future extensibility

-- 1. PRIMARY PERFORMANCE INDEX: Composite index for our main query pattern
-- This covers the most common filtering: visibility + status + date range
CREATE INDEX idx_sessions_main_query 
ON sessions (visibility, status, date) 
WHERE location_point IS NOT NULL;

-- 2. DATE RANGE OPTIMIZATION: Dedicated index for date filtering
-- B-tree is perfect for range queries (date >= X AND date <= Y)
CREATE INDEX idx_sessions_date_range 
ON sessions (date) 
WHERE status = 'scheduled' AND visibility = 'public';

-- 3. SPATIAL INDEX: Keep spatial separate for better performance
-- GIST is optimized for spatial operations only
CREATE INDEX idx_sessions_spatial_only 
ON sessions USING GIST (location_point) 
WHERE status = 'scheduled' AND location_point IS NOT NULL;

-- 4. ACTIVE SESSIONS INDEX: Index for scheduled sessions with visibility
-- Most queries are for scheduled public/friends sessions
CREATE INDEX idx_sessions_active 
ON sessions (date, start_time, visibility, status) 
WHERE status = 'scheduled' 
  AND visibility IN ('public', 'friends'); -- Prepare for friends

-- 5. USER SESSIONS INDEX: For excluding user's own sessions efficiently  
CREATE INDEX idx_sessions_user_visibility 
ON sessions (user_id, visibility, status, date) 
WHERE status = 'scheduled';

-- 6. COVERING INDEX: Include commonly accessed columns to avoid table lookups
-- This can serve queries without hitting the main table
CREATE INDEX idx_sessions_covering 
ON sessions (visibility, status, date) 
INCLUDE (id, user_id, start_time, end_time, location_display_address)
WHERE location_point IS NOT NULL AND status = 'scheduled';

-- 7. PREPARE VISIBILITY ENUM for future friends functionality
-- Expand the existing visibility options to include friends
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_visibility_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_visibility_check 
CHECK (visibility IN ('public', 'private', 'friends'));

-- 9. STATISTICS UPDATE: Help PostgreSQL make better query plans
-- Update table statistics to reflect our query patterns
ANALYZE sessions;

-- 10. COMMENTS for future developers
COMMENT ON INDEX idx_sessions_main_query IS 'Primary index for visibility + status + date filtering in spatial queries';
COMMENT ON INDEX idx_sessions_spatial_only IS 'Spatial-only index for efficient PostGIS distance operations';
COMMENT ON INDEX idx_sessions_active IS 'Optimized for scheduled public/friends sessions - most common query pattern';
