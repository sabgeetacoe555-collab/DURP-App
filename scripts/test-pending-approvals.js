const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPendingApprovals() {
  try {
    console.log('🔍 Testing pending approvals function...')
    
    // Test with the group ID from your example
    const groupId = 'bff67edc-c598-4120-a149-a3d64d03ae12'
    
    const { data, error } = await supabase.rpc('get_pending_group_approvals', {
      group_id_param: groupId
    })
    
    if (error) {
      console.error('❌ Error calling function:', error)
    } else {
      console.log('✅ Function result:', data)
    }
    
    // Also test direct query to see what's in the table
    console.log('\n🔍 Direct query to group_members table...')
    const { data: directData, error: directError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
    
    if (directError) {
      console.error('❌ Error with direct query:', directError)
    } else {
      console.log('✅ Direct query result:', directData)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testPendingApprovals()
