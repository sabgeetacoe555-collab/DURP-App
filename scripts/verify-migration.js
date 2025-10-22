const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables')
  console.log('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyMigration() {
  try {
    console.log('Verifying database schema...')
    
    // Try to query the sessions table to see what columns exist
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error accessing sessions table:', error.message)
      return
    }
    
    // Get the column names from the first row
    if (data && data.length > 0) {
      const firstRow = data[0]
      const columns = Object.keys(firstRow)
      
      console.log('\nCurrent sessions table columns:')
      columns.forEach(col => {
        console.log(`- ${col}`)
      })
      
      // Check for specific fields we're looking for
      const phase1Fields = [
        'allow_guests',
        'visibility', 
        'dupr_min',
        'dupr_max',
        'status',
        'max_players'
      ]
      
      const existingFields = [
        'allow_friends',
        'is_public',
        'min_dupr_rating',
        'max_dupr_rating',
        'session_status'
      ]
      
      console.log('\nPhase 1 Migration Fields:')
      phase1Fields.forEach(field => {
        const exists = columns.includes(field)
        console.log(`- ${field}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`)
      })
      
      console.log('\nExisting Fields (from earlier migrations):')
      existingFields.forEach(field => {
        const exists = columns.includes(field)
        console.log(`- ${field}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`)
      })
      
      // Summary
      const missingPhase1Fields = phase1Fields.filter(field => !columns.includes(field))
      if (missingPhase1Fields.length > 0) {
        console.log(`\n❌ Missing Phase 1 fields: ${missingPhase1Fields.join(', ')}`)
        console.log('You need to run the migration: 20250805000003_add_missing_phase_1_fields.sql')
      } else {
        console.log('\n✅ All Phase 1 fields are present!')
      }
      
    } else {
      console.log('No data in sessions table to analyze schema')
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

verifyMigration()
