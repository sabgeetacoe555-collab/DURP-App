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

async function checkSchemaDirect() {
  try {
    console.log('Checking database schema directly...')
    
    // Try to insert a test session to see what columns are expected
    const testSession = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      session_datetime: new Date().toISOString(),
      end_datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
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
      console.error('Error inserting test session:', error.message)
      
      // If it's a column error, let's try to identify which columns are missing
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('\nThis suggests some columns are missing from the sessions table.')
        console.log('The error indicates the database schema doesn\'t match what the code expects.')
        
        // Let's try a minimal insert to see what works
        const minimalSession = {
          user_id: '00000000-0000-0000-0000-000000000000',
          session_datetime: new Date().toISOString(),
          end_datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          location: 'Test',
          session_type: 'test',
          focus_type: [],
          completed: false
        }
        
        const { data: minData, error: minError } = await supabase
          .from('sessions')
          .insert(minimalSession)
          .select()
        
        if (minError) {
          console.error('Even minimal insert failed:', minError.message)
        } else {
          console.log('Minimal insert succeeded. The issue is with optional fields.')
          // Clean up the test data
          await supabase.from('sessions').delete().eq('id', minData[0].id)
        }
      }
    } else {
      console.log('✅ Test session created successfully!')
      console.log('All required columns are present.')
      
      // Clean up the test data
      await supabase.from('sessions').delete().eq('id', data[0].id)
      console.log('Test data cleaned up.')
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

checkSchemaDirect()
