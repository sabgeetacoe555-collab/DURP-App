#!/usr/bin/env node

// Test the health endpoint
const { createClient } = require("@supabase/supabase-js")

// Use the same configuration as the app
const supabaseUrl = "https://feetcenkvxrmfltorlru.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZXRjZW5rdnhybWZsdG9ybHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzI5NzAsImV4cCI6MjA0NzU0ODk3MH0.5309fddf5bcd9328447bd844f3bc6c5a76aff83b64a40af03eb3313f003e876a"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test health endpoint
async function testHealth() {
  console.log("🔍 Testing Health Endpoint...\n")

  try {
    console.log("🧪 Testing Health Endpoint")
    const { data, error } = await supabase.functions.invoke("dupr-api", {
      body: { action: "health" },
    })

    if (error) {
      console.log("❌ Health endpoint failed:", error)
      console.log("Error details:", error.context?.body)
    } else {
      console.log("✅ Health endpoint successful!")
      console.log("Health data:", JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.log("❌ Unexpected error:", error.message)
  }
}

// Run test
async function runTest() {
  console.log("🚀 Starting Health Endpoint Test...\n")

  await testHealth()

  console.log("\n✨ Test completed!")
}

runTest().catch(console.error)
