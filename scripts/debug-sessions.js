const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugSessions() {
  try {
    console.log('Debugging sessions...')
    
    // First, let's check if we're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('No authenticated user found')
      return
    }
    
    console.log(`Authenticated as user: ${user.id}`)
    
    // Get all sessions for this user
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching sessions:', error)
      return
    }
    
    console.log(`\nFound ${sessions.length} sessions for user ${user.id}:`)
    
    const now = new Date()
    console.log(`Current time: ${now.toISOString()}`)
    
    sessions.forEach((session, index) => {
      console.log(`\nSession ${index + 1}:`)
      console.log(`  ID: ${session.id}`)
      console.log(`  Created: ${session.created_at}`)
      console.log(`  Session datetime: ${session.session_datetime}`)
      console.log(`  End datetime: ${session.end_datetime}`)
      console.log(`  Location: ${session.location}`)
      console.log(`  Type: ${session.session_type}`)
      console.log(`  Status: ${session.status}`)
      console.log(`  Completed: ${session.completed}`)
      
      if (session.session_datetime) {
        const sessionDate = new Date(session.session_datetime)
        const isFuture = sessionDate > now
        console.log(`  Session time: ${sessionDate.toISOString()}`)
        console.log(`  Is future: ${isFuture}`)
        console.log(`  Time difference: ${(sessionDate - now) / 1000 / 60} minutes`)
      } else {
        console.log(`  Session datetime: NULL`)
      }
    })
    
    // Test the same filtering logic as the app
    const futureSessions = sessions.filter((session) => {
      if (!session.session_datetime) return false
      return new Date(session.session_datetime) > now
    })
    
    console.log(`\nFuture sessions (after filtering): ${futureSessions.length}`)
    
    if (futureSessions.length === 0 && sessions.length > 0) {
      console.log('\n⚠️  All sessions are in the past or have no datetime!')
      console.log('This explains why you see "No sessions yet" in the app.')
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

debugSessions()
