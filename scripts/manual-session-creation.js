// Script to generate the exact SQL commands needed to create a test session and invite
// Run these commands in your Supabase SQL editor

function generateSQLCommands() {
  console.log("🚀 Generating SQL commands for manual session creation...")

  // Test user data
  const testUser = {
    id: "fdf74557-2696-4e73-b23c-662b9798e734",
    email: "test-1756324331579@example.com",
    name: "test-1756324331579@example.com",
  }

  // Your phone number
  const inviteePhone = "6195506492"

  // Generate a session ID
  const sessionId = "test-session-" + Date.now()

  // Create session data
  const sessionData = {
    id: sessionId,
    creator_id: testUser.id,
    name: "Test Pickleball Session",
    session_type: "open play",
    location: "Test Courts, San Diego, CA",
    session_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
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

  // Generate the SMS message
  const sessionDate = new Date(sessionData.session_datetime).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  )

  const sessionTime = new Date(sessionData.session_datetime).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  )

  const sessionEndTime = new Date(sessionData.end_datetime).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  )

  const duprText =
    sessionData.dupr_min && sessionData.dupr_max
      ? `\n🎯 DUPR: ${sessionData.dupr_min.toFixed(
          2
        )} - ${sessionData.dupr_max.toFixed(2)}`
      : sessionData.dupr_min
      ? `\n🎯 DUPR: ${sessionData.dupr_min.toFixed(2)}+`
      : sessionData.dupr_max
      ? `\n🎯 DUPR: Up to ${sessionData.dupr_max.toFixed(2)}`
      : ""

  const deepLinkUrl = `https://netgains.app/${
    sessionData.id
  }?phone=${encodeURIComponent(inviteePhone)}&invite=true`

  const message = `Hey! I'm inviting you to a pickleball session:

🏓 ${sessionData.session_type || sessionData.name || "Pickleball Session"}
📅 ${sessionDate}
⏰ ${sessionTime} - ${sessionEndTime}
📍 ${sessionData.location}
👥 Max ${sessionData.max_players} players${
    sessionData.allow_guests ? " (guests welcome)" : ""
  }${duprText}

Join me! Download Net Gains: ${deepLinkUrl}

See you on the court! 🎾`

  console.log("=".repeat(80))
  console.log("📱 TEST SMS INVITATION MESSAGE")
  console.log("=".repeat(80))
  console.log("👤 From:", testUser.name)
  console.log("📞 To:", inviteePhone)
  console.log("🔗 Deep Link URL:", deepLinkUrl)
  console.log("📅 Session Date:", sessionDate)
  console.log("⏰ Session Time:", `${sessionTime} - ${sessionEndTime}`)
  console.log("📍 Location:", sessionData.location)
  console.log("👥 Max Players:", sessionData.max_players)
  console.log("🎯 DUPR Range:", duprText || "Not specified")
  console.log("=".repeat(80))
  console.log("💬 COMPLETE SMS MESSAGE:")
  console.log("=".repeat(80))
  console.log(message)
  console.log("=".repeat(80))
  console.log("")
  console.log("📋 SQL COMMANDS TO RUN IN SUPABASE:")
  console.log("=".repeat(80))
  console.log("")
  console.log("-- 1. Create the session")
  console.log(`INSERT INTO sessions (
  id,
  creator_id,
  name,
  session_type,
  location,
  session_datetime,
  end_datetime,
  max_players,
  allow_guests,
  visibility,
  dupr_min,
  dupr_max,
  created_at,
  updated_at
) VALUES (
  '${sessionData.id}',
  '${sessionData.creator_id}',
  '${sessionData.name}',
  '${sessionData.session_type}',
  '${sessionData.location}',
  '${sessionData.session_datetime}',
  '${sessionData.end_datetime}',
  ${sessionData.max_players},
  ${sessionData.allow_guests},
  '${sessionData.visibility}',
  ${sessionData.dupr_min},
  ${sessionData.dupr_max},
  '${sessionData.created_at}',
  '${sessionData.updated_at}'
);`)
  console.log("")
  console.log("-- 2. Create the SMS invite")
  console.log(`INSERT INTO session_invites (
  session_id,
  invitee_name,
  invitee_phone,
  invitee_id,
  created_at,
  updated_at
) VALUES (
  '${sessionData.id}',
  'Test Invitee',
  '${inviteePhone}',
  NULL,
  '${sessionData.created_at}',
  '${sessionData.updated_at}'
);`)
  console.log("")
  console.log("=".repeat(80))
  console.log("✅ After running these SQL commands, you can test the deeplink:")
  console.log("📱", deepLinkUrl)
  console.log("=".repeat(80))
}

// Run the script
generateSQLCommands()
