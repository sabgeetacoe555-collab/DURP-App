-- Create sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT,
  session_type TEXT NOT NULL,
  focus_type TEXT[] DEFAULT '{}',
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  body_readiness INTEGER CHECK (body_readiness >= 1 AND body_readiness <= 10),
  completed BOOLEAN DEFAULT false,
  confidence INTEGER CHECK (confidence >= 1 AND confidence <= 10),
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
  goal_achievement TEXT,
  reflection_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policy so users can only see their own sessions
CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_date_idx ON sessions(date);
CREATE INDEX sessions_completed_idx ON sessions(completed);