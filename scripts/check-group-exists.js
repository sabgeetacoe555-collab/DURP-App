const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkGroupExists() {
  try {
    const groupId = "bff67edc-c598-4120-a149-a3d64d03ae12"

    console.log("🔍 Checking if group exists:", groupId)

    // Check if group exists
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single()

    console.log("Query result:")
    console.log("  data:", group)
    console.log("  error:", groupError)

    if (groupError) {
      console.log("❌ Group not found or error:", groupError.message)

      // Let's also check if there are any groups at all
      const { data: allGroups, error: allGroupsError } = await supabase
        .from("groups")
        .select("id, name, created_at")
        .limit(5)

      console.log("\n📋 Sample groups in database:")
      console.log("  data:", allGroups)
      console.log("  error:", allGroupsError)
    } else {
      console.log("✅ Group found:", group)
    }
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

checkGroupExists()
