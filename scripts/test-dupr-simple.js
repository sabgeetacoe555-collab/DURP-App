#!/usr/bin/env node

// Simple test to check edge function basic functionality
const { createClient } = require("@supabase/supabase-js")

// Use the same configuration as the app
const supabaseUrl = "https://feetcenkvxrmfltorlru.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZXRjZW5rdnhybWZsdG9ybHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzI5NzAsImV4cCI6MjA0NzU0ODk3MH0.5309fddf5bcd9328447bd844f3bc6c5a76aff83b64a40af03eb3313f003e876a"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test basic edge function functionality
async function testBasicFunctionality() {
  console.log("🔍 Testing Basic Edge Function Functionality...\n")

  try {
    // Test 1: Debug endpoint to check environment variables
    console.log("🧪 Test 1: Debug Endpoint")
    const { data: debugData, error: debugError } =
      await supabase.functions.invoke("dupr-api", {
        body: { action: "debug" },
      })

    if (debugError) {
      console.log("❌ Debug endpoint failed:", debugError)
      console.log("Error details:", debugError.context?.body)
    } else {
      console.log("✅ Debug endpoint successful!")
      console.log("Debug data:", JSON.stringify(debugData, null, 2))
    }

    // Test 2: Test client auth endpoint
    console.log("\n🧪 Test 2: Test Client Auth Endpoint")
    const { data: testAuthData, error: testAuthError } =
      await supabase.functions.invoke("dupr-api", {
        body: { action: "testClientAuth" },
      })

    if (testAuthError) {
      console.log("❌ Test client auth failed:", testAuthError)
      console.log("Error details:", testAuthError.context?.body)
    } else {
      console.log("✅ Test client auth successful!")
      console.log("Test auth data:", JSON.stringify(testAuthData, null, 2))
    }

    // Test 3: Test DUPR user authentication with known working email
    console.log("\n🧪 Test 3: DUPR User Authentication")
    const { data: userData, error: userError } =
      await supabase.functions.invoke("dupr-api", {
        body: {
          action: "authenticateUser",
          email: "chris.chidgey@toptal.com",
          password: "Test@123!",
        },
      })

    if (userError) {
      console.log("❌ DUPR user authentication failed:", userError)
      console.log("Error details:", userError.context?.body)
    } else {
      console.log("✅ DUPR user authentication successful!")
      console.log("User data:", JSON.stringify(userData, null, 2))
    }
  } catch (error) {
    console.log("❌ Unexpected error:", error.message)
  }
}

// Run test
async function runTest() {
  console.log("🚀 Starting Basic Edge Function Test...\n")

  await testBasicFunctionality()

  console.log("\n✨ Test completed!")
}

runTest().catch(console.error)
