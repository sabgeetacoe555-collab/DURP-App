const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)

async function createTestSession() {
  let userId

  try {
    // Get current user (you need to be logged in via supabase)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("No authenticated user found.")
      console.log("Generating a proper UUID for testing instead...")

      // Just create a properly formatted UUID for testing
      const { randomUUID } = require("crypto")
      const mockSessionId = randomUUID()
      console.log("✅ Generated test session ID:", mockSessionId)
      console.log("📱 Use this session ID for testing")

      // Update the test script with this UUID
      const fs = require("fs")
      const testScript = fs.readFileSync(
        "scripts/test-sms-deep-link.js",
        "utf8"
      )
      const updatedScript = testScript.replace(
        /const testSessionId =[\s\S]*?Date\.now\(\)\.toString\(\)\.padStart\(12, "0"\)/,
        `const testSessionId = "${mockSessionId}"`
      )
      fs.writeFileSync("scripts/test-sms-deep-link.js", updatedScript)
      console.log("✅ Updated test-sms-deep-link.js with real UUID")
      return
    }

    userId = user.id

    console.log("Using user ID:", userId)

    // Create a test session
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const sessionStart = new Date(tomorrow)
    sessionStart.setHours(10, 0, 0, 0) // 10:00 AM
    const sessionEnd = new Date(tomorrow)
    sessionEnd.setHours(12, 0, 0, 0) // 12:00 PM

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        name: "Test Deep Link Session",
        location: "Test Location",
        session_datetime: sessionStart.toISOString(),
        end_datetime: sessionEnd.toISOString(),
        max_players: 4,
        visibility: "private",
        session_type: "social",
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Error creating session:", sessionError)
      return
    }

    console.log("✅ Created test session:", session.id)
    console.log("Name:", session.name)

    // Create a test invite for this session
    const { data: invite, error: inviteError } = await supabase
      .from("session_invites")
      .insert({
        session_id: session.id,
        inviter_id: userId,
        invitee_name: "Test User",
        invitee_phone: "+15551234567",
        status: "pending",
      })
      .select()
      .single()

    if (inviteError) {
      console.error("Error creating invite:", inviteError)
      return
    }

    console.log("✅ Created test invite:", invite.id)
    console.log("📱 Use this session ID for testing:", session.id)
  } catch (error) {
    console.error("Error:", error)
  }
}

createTestSession()
