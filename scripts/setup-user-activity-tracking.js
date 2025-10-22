// scripts/setup-user-activity-tracking.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createUserActivitiesTable() {
  console.log('Creating user_activities table if it does not exist...')
  
  try {
    // Create the table using SQL
    const { data, error } = await supabase.rpc('create_user_activities_table')
    
    if (error) {
      console.error('Error creating table:', error)
      
      // Try using SQL directly if the RPC function is not available
      console.log('Attempting to create table using SQL directly...')
      
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS user_activities (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          action_type TEXT NOT NULL,
          screen TEXT,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
          details JSONB,
          session_id TEXT,
          duration_ms INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        -- Create indexes for faster queries
        CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_activities_action_type ON user_activities(action_type);
        CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON user_activities(timestamp);
      `
      
      const { data: sqlData, error: sqlError } = await supabase.rpc(
        'run_sql', 
        { query: createTableQuery }
      )
      
      if (sqlError) {
        console.error('Error creating table with SQL:', sqlError)
        return false
      }
      
      console.log('Table created successfully using SQL')
      return true
    }
    
    console.log('Table created successfully using RPC')
    return true
  } catch (err) {
    console.error('Unexpected error:', err)
    return false
  }
}

async function setupRLS() {
  console.log('Setting up Row Level Security policies...')
  
  try {
    const rlsQuery = `
      -- Enable RLS on the table
      ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
      
      -- Create policy to allow authenticated users to insert their own activity
      CREATE POLICY insert_own_activity ON user_activities
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = user_id);
      
      -- Create policy to allow users to select only their own activity
      CREATE POLICY select_own_activity ON user_activities
        FOR SELECT TO authenticated
        USING (auth.uid() = user_id);
      
      -- Allow service role and anon to access all (controlled by JWT)
      CREATE POLICY service_role_access ON user_activities
        FOR ALL TO service_role
        USING (true);
    `
    
    const { data, error } = await supabase.rpc('run_sql', { query: rlsQuery })
    
    if (error) {
      console.error('Error setting up RLS:', error)
      return false
    }
    
    console.log('RLS policies created successfully')
    return true
  } catch (err) {
    console.error('Unexpected error setting up RLS:', err)
    return false
  }
}

async function main() {
  console.log('Setting up user activity tracking...')
  
  // Create the table
  const tableCreated = await createUserActivitiesTable()
  if (!tableCreated) {
    console.log('Failed to create table. Exiting.')
    return
  }
  
  // Set up RLS
  const rlsSetup = await setupRLS()
  if (!rlsSetup) {
    console.log('Failed to set up RLS. Table created but security policies not applied.')
    return
  }
  
  console.log('✅ User activity tracking setup completed successfully')
}

main()
  .catch(err => {
    console.error('Setup failed:', err)
    process.exit(1)
  })