const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testGroupInvite() {
  try {
    console.log("🧪 Testing Group Invite Functionality...\n")

    // First, let's get a group to test with
    const { data: groups, error: groupsError } = await supabase
      .from("groups")
      .select("id, name, description")
      .limit(1)

    if (groupsError) {
      console.error("❌ Error fetching groups:", groupsError)
      return
    }

    if (!groups || groups.length === 0) {
      console.log("⚠️  No groups found. Creating a test group...")

      // Create a test group
      const { data: newGroup, error: createError } = await supabase
        .from("groups")
        .insert({
          name: "Test Group for Invite",
          description: "A test group for testing invite functionality",
          user_id: "00000000-0000-0000-0000-000000000000", // Placeholder user ID
        })
        .select()
        .single()

      if (createError) {
        console.error("❌ Error creating test group:", createError)
        return
      }

      console.log("✅ Created test group:", newGroup)
      groups.push(newGroup)
    }

    const testGroup = groups[0]
    console.log("📋 Testing with group:", testGroup)

    // Test the getGroupByIdForInvite function
    console.log("\n🔍 Testing getGroupByIdForInvite function...")

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", testGroup.id)
      .single()

    if (groupError) {
      console.error("❌ Error fetching group for invite:", groupError)
      console.log("Error details:", {
        code: groupError.code,
        message: groupError.message,
        details: groupError.details,
        hint: groupError.hint,
      })
    } else {
      console.log("✅ Successfully fetched group for invite:", group)
    }

    // Test the deep link URL generation
    console.log("\n🔗 Testing deep link URL generation...")
    const deepLinkUrl = `https://netgains.app/g-${testGroup.id}?invite=true`
    console.log("Generated deep link URL:", deepLinkUrl)

    // Test URL parsing
    console.log("\n🔍 Testing URL parsing...")
    const urlObj = new URL(deepLinkUrl)
    const pathParts = urlObj.pathname.split("/")
    console.log("URL host:", urlObj.host)
    console.log("URL pathname:", urlObj.pathname)
    console.log("Path parts:", pathParts)
    console.log("Search params:", urlObj.searchParams.toString())

    if (pathParts[1] && pathParts[1].startsWith("g-")) {
      const groupId = pathParts[1].substring(2) // Remove "g-" prefix
      const invite = urlObj.searchParams.get("invite") === "true"

      console.log("✅ Parsed group ID:", groupId)
      console.log("✅ Parsed invite flag:", invite)

      if (groupId === testGroup.id) {
        console.log("✅ Group ID matches!")
      } else {
        console.log("❌ Group ID mismatch!")
      }
    } else {
      console.log("❌ Failed to parse group ID from URL")
    }

    console.log("\n🎉 Group invite test completed!")
  } catch (error) {
    console.error("❌ Test failed with error:", error)
  }
}

testGroupInvite()
