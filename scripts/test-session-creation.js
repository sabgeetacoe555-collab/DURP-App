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

async function testSessionCreation() {
  try {
    console.log('Testing session creation...')
    
    // First, let's try to sign in with a test user or check if we're already signed in
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('No authenticated user found. Testing schema by attempting to query...')
      
      // Try to query the sessions table to see if it exists and has the right columns
      const { data, error } = await supabase
        .from('sessions')
        .select('id, session_datetime, end_datetime, allow_guests, visibility, status')
        .limit(1)
      
      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.error('❌ Schema error: Missing columns detected')
          console.error('Error:', error.message)
        } else if (error.message.includes('permission denied')) {
          console.log('✅ Schema appears correct - permission denied is expected without auth')
          console.log('The error suggests the columns exist but RLS is blocking access (which is correct)')
        } else {
          console.error('Unexpected error:', error.message)
        }
      } else {
        console.log('✅ Schema test passed - able to query sessions table')
        console.log('Columns exist and are accessible')
      }
    } else {
      console.log(`Authenticated as user: ${user.id}`)
      
      // Try to create a test session with the authenticated user
      const testSession = {
        session_datetime: new Date().toISOString(),
        end_datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        session_type: 'test',
        focus_type: [],
        completed: false,
        visibility: 'public',
        max_players: 4,
        allow_guests: false,
        status: 'scheduled'
      }
      
      const { data, error } = await supabase
        .from('sessions')
        .insert(testSession)
        .select()
      
      if (error) {
        console.error('❌ Error creating test session:', error.message)
        
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log('This indicates missing columns in the database schema.')
        }
      } else {
        console.log('✅ Test session created successfully!')
        console.log('All required columns are present and working.')
        
        // Clean up
        await supabase.from('sessions').delete().eq('id', data[0].id)
        console.log('Test data cleaned up.')
      }
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

testSessionCreation()
