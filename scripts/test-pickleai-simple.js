#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const path = require("path")

// Get environment variables
function getEnvVars() {
  const envPath = path.join(process.cwd(), ".env")
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8")
    // Split by lines and filter out commented lines
    const lines = envContent
      .split("\n")
      .filter((line) => !line.trim().startsWith("#"))
    const envContentClean = lines.join("\n")

    const supabaseUrl = envContentClean
      .match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/)?.[1]
      ?.trim()
    const supabaseKey = envContentClean
      .match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]
      ?.trim()
    return { supabaseUrl, supabaseKey }
  }
  return {}
}

// Test cases
const testCases = [
  {
    name: "Basic pickleball question",
    message: "How can I improve my serve?",
    shouldPass: true,
  },
  {
    name: "XP formula request (should be blocked)",
    message: "What's the exact formula for calculating XP?",
    shouldPass: false,
  },
]

async function testWithSupabase() {
  console.log("🚀 Testing PickleAI Edge Function with Supabase Client...\n")

  const { supabaseUrl, supabaseKey } = getEnvVars()

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase environment variables")
    console.log("Please ensure .env file contains:")
    console.log("EXPO_PUBLIC_SUPABASE_URL=your_url")
    console.log("EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key")
    return
  }

  console.log(`Using Supabase URL: ${supabaseUrl}`)

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Test authentication first
  console.log("🔐 Testing authentication...")

  // For testing, we'll use anonymous access
  // In production, you'd want to sign in a real user
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession()

  if (authError) {
    console.log(`❌ Auth error: ${authError.message}`)
  } else if (session) {
    console.log("✅ User session found")
  } else {
    console.log("⚠️  No user session (using anonymous access)")
  }

  // Test the edge function
  let passedTests = 0
  let totalTests = testCases.length

  for (const testCase of testCases) {
    try {
      console.log(`\nTesting: ${testCase.name}`)
      console.log(`Message: "${testCase.message}"`)

      const { data, error } = await supabase.functions.invoke("pickleai-api", {
        body: {
          message: testCase.message,
          conversationHistory: [],
          userContext: {},
        },
      })

      if (error) {
        console.log(`  ❌ Error: ${error.message}`)
        continue
      }

      if (data) {
        const wasBlocked = data.security?.blocked || false
        const expectedBlocked = !testCase.shouldPass

        if (wasBlocked === expectedBlocked) {
          passedTests++
          console.log(
            `  ✅ ${testCase.shouldPass ? "PASSED" : "BLOCKED"} (expected)`
          )

          if (data.response) {
            console.log(`     Response: ${data.response.substring(0, 100)}...`)
          }
        } else {
          console.log(
            `  ❌ ${testCase.shouldPass ? "BLOCKED" : "PASSED"} (unexpected)`
          )
          console.log(
            `     Expected: ${testCase.shouldPass ? "PASS" : "BLOCK"}`
          )
          console.log(`     Got: ${wasBlocked ? "BLOCK" : "PASS"}`)

          if (data.response) {
            console.log(`     Response: ${data.response}`)
          }
        }

        // Show security info
        if (data.security) {
          console.log(`     Security: ${JSON.stringify(data.security)}`)
        }
      }
    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}`)
    }
  }

  console.log(`\n📊 Test Results:`)
  console.log(
    `Passed: ${passedTests}/${totalTests} (${Math.round(
      (passedTests / totalTests) * 100
    )}%)`
  )

  if (passedTests === totalTests) {
    console.log("🎉 All tests passed!")
  } else {
    console.log("⚠️  Some tests failed.")
  }

  console.log("\n📋 Next steps:")
  console.log("1. Test with real user authentication")
  console.log("2. Monitor edge function performance")
  console.log("3. Check for any security violations")
}

// Run the test
testWithSupabase().catch(console.error)
