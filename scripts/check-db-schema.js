const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabaseSchema() {
  try {
    console.log('Checking sessions table schema...')
    
    // Query to get column information for sessions table
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'sessions' })
    
    if (error) {
      // Fallback to direct SQL query
      const { data: columns, error: sqlError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'sessions')
        .eq('table_schema', 'public')
        .order('ordinal_position')
      
      if (sqlError) {
        console.error('Error querying schema:', sqlError)
        return
      }
      
      console.log('\nCurrent sessions table columns:')
      columns.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`)
      })
      
      // Check for specific fields we're looking for
      const hasAllowGuests = columns.some(col => col.column_name === 'allow_guests')
      const hasAllowFriends = columns.some(col => col.column_name === 'allow_friends')
      const hasVisibility = columns.some(col => col.column_name === 'visibility')
      const hasMaxPlayers = columns.some(col => col.column_name === 'max_players')
      const hasDuprMin = columns.some(col => col.column_name === 'dupr_min')
      const hasDuprMax = columns.some(col => col.column_name === 'dupr_max')
      const hasStatus = columns.some(col => col.column_name === 'status')
      
      console.log('\nField Status:')
      console.log(`- allow_guests: ${hasAllowGuests ? '✅ EXISTS' : '❌ MISSING'}`)
      console.log(`- allow_friends: ${hasAllowFriends ? '✅ EXISTS' : '❌ MISSING'}`)
      console.log(`- visibility: ${hasVisibility ? '✅ EXISTS' : '❌ MISSING'}`)
      console.log(`- max_players: ${hasMaxPlayers ? '✅ EXISTS' : '❌ MISSING'}`)
      console.log(`- dupr_min: ${hasDuprMin ? '✅ EXISTS' : '❌ MISSING'}`)
      console.log(`- dupr_max: ${hasDuprMax ? '✅ EXISTS' : '❌ MISSING'}`)
      console.log(`- status: ${hasStatus ? '✅ EXISTS' : '❌ MISSING'}`)
      
      if (!hasAllowGuests) {
        console.log('\n❌ The allow_guests field is missing! This suggests the Phase 1 migration was not applied.')
        console.log('You need to run the migration: 20250713025349_enhanced_session_creation_phase_1.sql')
      }
      
    } else {
      console.log('Schema data:', data)
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

checkDatabaseSchema()
