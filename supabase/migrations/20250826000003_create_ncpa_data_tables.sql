-- Create NCPA data tables for caching external API data
-- This allows us to fetch data once per day instead of from every user

-- NCPA Players table
CREATE TABLE ncpa_players (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  college TEXT,
  gender TEXT NOT NULL,
  division INTEGER NOT NULL,
  singles_games_played INTEGER DEFAULT 0,
  doubles_games_played INTEGER DEFAULT 0,
  mixed_doubles_games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  singles_rating DECIMAL(4,2),
  doubles_rating DECIMAL(4,2),
  mixed_doubles_rating DECIMAL(4,2),
  overall_rating DECIMAL(4,2),
  last_overall DECIMAL(4,2),
  last_singles_game TIMESTAMP,
  last_doubles_game TIMESTAMP,
  last_mixed_doubles_game TIMESTAMP,
  hidden INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NCPA Universities table
CREATE TABLE ncpa_universities (
  id SERIAL PRIMARY KEY,
  college_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  ranking INTEGER,
  alias TEXT,
  points INTEGER,
  color TEXT,
  picture TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NCPA Tournaments table
CREATE TABLE ncpa_tournaments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  venue TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  registration_open DATE NOT NULL,
  registration_close DATE NOT NULL,
  begin_date DATE NOT NULL,
  end_date DATE NOT NULL,
  university INTEGER NOT NULL,
  number_of_bids INTEGER,
  nationals INTEGER DEFAULT 0,
  num_teams INTEGER DEFAULT 0,
  num_players INTEGER DEFAULT 0,
  player_event_types TEXT,
  bracket_event_types TEXT,
  team_hosts TEXT,
  status TEXT DEFAULT 'current', -- 'current', 'upcoming', 'past'
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NCPA Data Sync Log table
CREATE TABLE ncpa_sync_log (
  id SERIAL PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'players', 'universities', 'tournaments', 'all'
  status TEXT NOT NULL, -- 'success', 'error', 'partial'
  records_processed INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER
);

-- Create indexes for better query performance
CREATE INDEX idx_ncpa_players_college ON ncpa_players(college);
CREATE INDEX idx_ncpa_players_division ON ncpa_players(division);
CREATE INDEX idx_ncpa_players_gender ON ncpa_players(gender);
CREATE INDEX idx_ncpa_players_singles_rating ON ncpa_players(singles_rating);
CREATE INDEX idx_ncpa_players_overall_rating ON ncpa_players(overall_rating);
CREATE INDEX idx_ncpa_players_hidden ON ncpa_players(hidden);
CREATE INDEX idx_ncpa_players_last_updated ON ncpa_players(last_updated);

CREATE INDEX idx_ncpa_universities_name ON ncpa_universities(name);
CREATE INDEX idx_ncpa_universities_ranking ON ncpa_universities(ranking);
CREATE INDEX idx_ncpa_universities_last_updated ON ncpa_universities(last_updated);

CREATE INDEX idx_ncpa_tournaments_begin_date ON ncpa_tournaments(begin_date);
CREATE INDEX idx_ncpa_tournaments_status ON ncpa_tournaments(status);
CREATE INDEX idx_ncpa_tournaments_nationals ON ncpa_tournaments(nationals);
CREATE INDEX idx_ncpa_tournaments_last_updated ON ncpa_tournaments(last_updated);

CREATE INDEX idx_ncpa_sync_log_sync_type ON ncpa_sync_log(sync_type);
CREATE INDEX idx_ncpa_sync_log_started_at ON ncpa_sync_log(started_at);

-- Enable RLS
ALTER TABLE ncpa_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncpa_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncpa_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncpa_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow read access to all authenticated users
CREATE POLICY "Allow read access to ncpa_players" ON ncpa_players
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to ncpa_universities" ON ncpa_universities
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to ncpa_tournaments" ON ncpa_tournaments
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to ncpa_sync_log" ON ncpa_sync_log
  FOR SELECT USING (true);

-- Only allow service role to write to these tables
CREATE POLICY "Service role can write to ncpa_players" ON ncpa_players
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can write to ncpa_universities" ON ncpa_universities
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can write to ncpa_tournaments" ON ncpa_tournaments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can write to ncpa_sync_log" ON ncpa_sync_log
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_ncpa_last_updated()
RETURNS trigger AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update last_updated
CREATE TRIGGER update_ncpa_players_last_updated
  BEFORE UPDATE ON ncpa_players
  FOR EACH ROW EXECUTE PROCEDURE update_ncpa_last_updated();

CREATE TRIGGER update_ncpa_universities_last_updated
  BEFORE UPDATE ON ncpa_universities
  FOR EACH ROW EXECUTE PROCEDURE update_ncpa_last_updated();

CREATE TRIGGER update_ncpa_tournaments_last_updated
  BEFORE UPDATE ON ncpa_tournaments
  FOR EACH ROW EXECUTE PROCEDURE update_ncpa_last_updated();

-- Function to get top NCPA players by rating
CREATE OR REPLACE FUNCTION get_top_ncpa_players(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  profile_id INTEGER,
  first_name TEXT,
  last_name TEXT,
  college TEXT,
  gender TEXT,
  division INTEGER,
  singles_rating DECIMAL(4,2),
  doubles_rating DECIMAL(4,2),
  mixed_doubles_rating DECIMAL(4,2),
  overall_rating DECIMAL(4,2),
  wins INTEGER,
  losses INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.profile_id,
    p.first_name,
    p.last_name,
    p.college,
    p.gender,
    p.division,
    p.singles_rating,
    p.doubles_rating,
    p.mixed_doubles_rating,
    p.overall_rating,
    p.wins,
    p.losses
  FROM ncpa_players p
  WHERE p.hidden = 0 
    AND p.overall_rating IS NOT NULL 
    AND p.overall_rating > 0
  ORDER BY p.overall_rating DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get NCPA players by college
CREATE OR REPLACE FUNCTION get_ncpa_players_by_college(college_name TEXT)
RETURNS TABLE (
  profile_id INTEGER,
  first_name TEXT,
  last_name TEXT,
  college TEXT,
  gender TEXT,
  division INTEGER,
  singles_rating DECIMAL(4,2),
  doubles_rating DECIMAL(4,2),
  mixed_doubles_rating DECIMAL(4,2),
  overall_rating DECIMAL(4,2),
  wins INTEGER,
  losses INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.profile_id,
    p.first_name,
    p.last_name,
    p.college,
    p.gender,
    p.division,
    p.singles_rating,
    p.doubles_rating,
    p.mixed_doubles_rating,
    p.overall_rating,
    p.wins,
    p.losses
  FROM ncpa_players p
  WHERE p.hidden = 0 
    AND p.college ILIKE '%' || college_name || '%'
  ORDER BY p.overall_rating DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current/upcoming tournaments
CREATE OR REPLACE FUNCTION get_current_ncpa_tournaments()
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  venue TEXT,
  venue_address TEXT,
  registration_open DATE,
  registration_close DATE,
  begin_date DATE,
  end_date DATE,
  university INTEGER,
  number_of_bids INTEGER,
  nationals INTEGER,
  num_teams INTEGER,
  num_players INTEGER,
  player_event_types TEXT,
  bracket_event_types TEXT,
  team_hosts TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.venue,
    t.venue_address,
    t.registration_open,
    t.registration_close,
    t.begin_date,
    t.end_date,
    t.university,
    t.number_of_bids,
    t.nationals,
    t.num_teams,
    t.num_players,
    t.player_event_types,
    t.bracket_event_types,
    t.team_hosts
  FROM ncpa_tournaments t
  WHERE t.begin_date >= CURRENT_DATE
    AND t.status IN ('current', 'upcoming')
  ORDER BY t.begin_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_top_ncpa_players(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ncpa_players_by_college(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_ncpa_tournaments() TO authenticated;
