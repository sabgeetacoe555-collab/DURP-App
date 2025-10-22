#!/usr/bin/env node

// Test DUPR authentication with user mapping
const { createClient } = require("@supabase/supabase-js")

// Use the same configuration as the app
const supabaseUrl = "https://feetcenkvxrmfltorlru.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZXRjZW5rdnhybWZsdG9ybHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzI5NzAsImV4cCI6MjA0NzU0ODk3MH0.5309fddf5bcd9328447bd844f3bc6c5a76aff83b64a40af03eb3313f003e876a"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test DUPR authentication with user mapping
async function testDuprUserMapping() {
  console.log("🔍 Testing DUPR User Mapping...\n")

  try {
    console.log("🧪 Testing DUPR authentication with user mapping")
    const { data, error } = await supabase.functions.invoke("dupr-api", {
      body: {
        action: "authenticateUser",
        email: "chris.chidgey@toptal.com", // DUPR email
        currentUserEmail: "chidgeychris@gmail.com", // NetGains user email
      },
    })

    if (error) {
      console.log("❌ DUPR authentication failed:", error)
      console.log("Error details:", error.context?.body)
    } else {
      console.log("✅ DUPR authentication successful!")
      console.log("User data:", JSON.stringify(data, null, 2))

      if (data?.success && data?.data?.result) {
        const user = data.data.result
        console.log("\n📊 DUPR User Information:")
        console.log("- DUPR ID:", user.id)
        console.log("- Name:", user.fullName)
        console.log("- Singles Rating:", user.ratings?.singles || "No rating")
        console.log("- Doubles Rating:", user.ratings?.doubles || "No rating")

        console.log(
          "\n💾 This data should now be saved to the NetGains user account:"
        )
        console.log("- NetGains Email: chidgeychris@gmail.com")
        console.log("- DUPR ID:", user.id)
        console.log("- Singles Rating:", user.ratings?.singles || 0)
        console.log("- Doubles Rating:", user.ratings?.doubles || 0)
      }
    }
  } catch (error) {
    console.log("❌ Unexpected error:", error.message)
  }
}

// Run test
async function runTest() {
  console.log("🚀 Starting DUPR User Mapping Test...\n")

  await testDuprUserMapping()

  console.log("\n✨ Test completed!")
}

runTest().catch(console.error)
