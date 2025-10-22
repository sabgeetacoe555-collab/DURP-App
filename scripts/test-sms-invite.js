const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestSessionAndInvite() {
  try {
    console.log("🚀 Creating test session and SMS invite...")

    // Test user data
    const testUser = {
      id: "fdf74557-2696-4e73-b23c-662b9798e734",
      email: "test-1756324331579@example.com",
      name: "test-1756324331579@example.com",
    }

    // Your phone number
    const inviteePhone = "6195506492"

    // Create session data
    const sessionData = {
      creator_id: testUser.id,
      name: "Test Pickleball Session",
      session_type: "open play",
      location: "Test Courts, San Diego, CA",
      session_datetime: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(), // Tomorrow
      end_datetime: new Date(
        Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
      ).toISOString(), // Tomorrow + 2 hours
      max_players: 4,
      allow_guests: true,
      visibility: "public",
      dupr_min: 3.0,
      dupr_max: 4.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("📝 Creating session...")
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert([sessionData])
      .select()
      .single()

    if (sessionError) {
      console.error("❌ Error creating session:", sessionError)
      return
    }

    console.log("✅ Session created:", session.id)

    // Create SMS invite
    const inviteData = {
      session_id: session.id,
      invitee_name: "Test Invitee",
      invitee_phone: inviteePhone,
      invitee_id: null, // SMS invite, no user ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("📱 Creating SMS invite...")
    const { data: invite, error: inviteError } = await supabase
      .from("session_invites")
      .insert([inviteData])
      .select()
      .single()

    if (inviteError) {
      console.error("❌ Error creating invite:", inviteError)
      return
    }

    console.log("✅ SMS invite created:", invite.id)

    // Generate the SMS message
    const sessionDate = new Date(session.session_datetime).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    )

    const sessionTime = new Date(session.session_datetime).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    )

    const sessionEndTime = new Date(session.end_datetime).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    )

    const duprText =
      session.dupr_min && session.dupr_max
        ? `\n🎯 DUPR: ${session.dupr_min.toFixed(
            2
          )} - ${session.dupr_max.toFixed(2)}`
        : session.dupr_min
        ? `\n🎯 DUPR: ${session.dupr_min.toFixed(2)}+`
        : session.dupr_max
        ? `\n🎯 DUPR: Up to ${session.dupr_max.toFixed(2)}`
        : ""

    const deepLinkUrl = `https://netgains.app/${
      session.id
    }?phone=${encodeURIComponent(inviteePhone)}&invite=true`

    const message = `Hey! I'm inviting you to a pickleball session:

🏓 ${session.session_type || session.name || "Pickleball Session"}
📅 ${sessionDate}
⏰ ${sessionTime} - ${sessionEndTime}
📍 ${session.location}
👥 Max ${session.max_players} players${
      session.allow_guests ? " (guests welcome)" : ""
    }${duprText}

Join me! Download Net Gains: ${deepLinkUrl}

See you on the court! 🎾`

    console.log("=".repeat(80))
    console.log("📱 TEST SMS INVITATION")
    console.log("=".repeat(80))
    console.log("👤 From:", testUser.name)
    console.log("📞 To:", inviteePhone)
    console.log("🔗 Deep Link URL:", deepLinkUrl)
    console.log("📅 Session Date:", sessionDate)
    console.log("⏰ Session Time:", `${sessionTime} - ${sessionEndTime}`)
    console.log("📍 Location:", session.location)
    console.log("👥 Max Players:", session.max_players)
    console.log("🎯 DUPR Range:", duprText || "Not specified")
    console.log("=".repeat(80))
    console.log("💬 COMPLETE SMS MESSAGE:")
    console.log("=".repeat(80))
    console.log(message)
    console.log("=".repeat(80))
    console.log("✅ Test session and invite created successfully!")
    console.log("📱 You can now test the deeplink by opening:", deepLinkUrl)
  } catch (error) {
    console.error("❌ Unexpected error:", error)
  }
}

// Run the script
createTestSessionAndInvite()
