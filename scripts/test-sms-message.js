// Script to generate test SMS message for deeplink testing
// This doesn't insert into the database, just shows the SMS message format

function generateTestSMSMessage() {
  console.log("🚀 Generating test SMS message for deeplink testing...")

  // Test user data
  const testUser = {
    id: "fdf74557-2696-4e73-b23c-662b9798e734",
    email: "test-1756324331579@example.com",
    name: "Test User",
  }

  // Your phone number
  const inviteePhone = "6195506492"

  // Generate a fake session ID for testing
  const fakeSessionId = "test-session-" + Date.now()

  // Create session data (fake for testing)
  const sessionData = {
    id: fakeSessionId,
    name: "Test Pickleball Session",
    session_type: "open play",
    location: "Test Courts, San Diego, CA",
    session_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    end_datetime: new Date(
      Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
    ), // Tomorrow + 2 hours
    max_players: 4,
    allow_guests: true,
    dupr_min: 3.0,
    dupr_max: 4.5,
  }

  // Generate the SMS message
  const sessionDate = sessionData.session_datetime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const sessionTime = sessionData.session_datetime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  const sessionEndTime = sessionData.end_datetime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

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
  console.log("✅ Test SMS message generated!")
  console.log("📱 You can test the deeplink by opening:", deepLinkUrl)
  console.log("")
  console.log("📋 To manually create the session in the database:")
  console.log("1. Use the Supabase dashboard or a script with service role key")
  console.log("2. Create session with ID:", sessionData.id)
  console.log("3. Add session_invite with phone:", inviteePhone)
  console.log("4. Test the deeplink above")
}

// Run the script
generateTestSMSMessage()
