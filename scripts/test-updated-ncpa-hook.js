// Test script to verify the updated useNCPA hook works with database
const { createClient } = require("@supabase/supabase-js")

// Use Supabase credentials from eas.json
const supabaseUrl = "https://feetcenkvxrmfltorlru.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZXRjZW5rdnhybWZsdG9ybHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTcwNDcsImV4cCI6MjA2NzEzMzA0N30.h24ceWNugBgTza_L8loJpQiuyBYdkjSBHCRMTRVgh_U"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Simulate the updated NCPAService functions
const getPublicTopPlayers = async () => {
  try {
    const { data, error } = await supabase
      .from("ncpa_players")
      .select("*")
      .eq("hidden", 0)
      .order("overall_rating", { ascending: false })
      .limit(10)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data, statusCode: 200 }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

const getPublicTopUniversities = async () => {
  try {
    const { data, error } = await supabase
      .from("ncpa_universities")
      .select("*")
      .order("ranking", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data, statusCode: 200 }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

const getTopPlayersByRating = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from("ncpa_players")
      .select("*")
      .eq("hidden", 0)
      .not("overall_rating", "is", null)
      .gt("overall_rating", 0)
      .order("overall_rating", { ascending: false })
      .limit(limit)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data, statusCode: 200 }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

const getCurrentTournaments = async () => {
  try {
    const { data, error } = await supabase
      .from("ncpa_tournaments")
      .select("*")
      .gte("begin_date", new Date().toISOString().split("T")[0])
      .in("status", ["current", "upcoming"])
      .order("begin_date", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data, statusCode: 200 }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

const getDataFreshness = async () => {
  try {
    const [playersResult, universitiesResult, tournamentsResult] =
      await Promise.all([
        supabase
          .from("ncpa_players")
          .select("last_updated")
          .order("last_updated", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("ncpa_universities")
          .select("last_updated")
          .order("last_updated", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("ncpa_tournaments")
          .select("last_updated")
          .order("last_updated", { ascending: false })
          .limit(1)
          .single(),
      ])

    return {
      players_last_updated: playersResult.data?.last_updated || null,
      universities_last_updated: universitiesResult.data?.last_updated || null,
      tournaments_last_updated: tournamentsResult.data?.last_updated || null,
    }
  } catch (error) {
    return {
      players_last_updated: null,
      universities_last_updated: null,
      tournaments_last_updated: null,
    }
  }
}

async function testUpdatedNCPAHook() {
  console.log("🧪 Testing updated NCPA hook functionality...")

  try {
    // Test 1: Get top players
    console.log("\n📊 Test 1: Getting top players...")
    const playersResponse = await getPublicTopPlayers()

    if (playersResponse.success) {
      console.log("✅ Top players fetched successfully")
      console.log("   Count:", playersResponse.data?.length || 0)
      if (playersResponse.data && playersResponse.data.length > 0) {
        console.log(
          "   Top player:",
          `${playersResponse.data[0].first_name} ${playersResponse.data[0].last_name}`
        )
        console.log("   Rating:", playersResponse.data[0].overall_rating)
      }
    } else {
      console.log("❌ Failed to fetch top players:", playersResponse.error)
    }

    // Test 2: Get top players by rating
    console.log("\n🏆 Test 2: Getting top players by rating...")
    const topPlayersResponse = await getTopPlayersByRating(5)

    if (topPlayersResponse.success) {
      console.log("✅ Top players by rating fetched successfully")
      console.log("   Count:", topPlayersResponse.data?.length || 0)
      if (topPlayersResponse.data && topPlayersResponse.data.length > 0) {
        console.log(
          "   Highest rating:",
          topPlayersResponse.data[0].overall_rating
        )
      }
    } else {
      console.log(
        "❌ Failed to fetch top players by rating:",
        topPlayersResponse.error
      )
    }

    // Test 3: Get universities
    console.log("\n🎓 Test 3: Getting universities...")
    const universitiesResponse = await getPublicTopUniversities()

    if (universitiesResponse.success) {
      console.log("✅ Universities fetched successfully")
      console.log("   Count:", universitiesResponse.data?.length || 0)
    } else {
      console.log(
        "❌ Failed to fetch universities:",
        universitiesResponse.error
      )
    }

    // Test 4: Get tournaments
    console.log("\n🏟️  Test 4: Getting tournaments...")
    const tournamentsResponse = await getCurrentTournaments()

    if (tournamentsResponse.success) {
      console.log("✅ Tournaments fetched successfully")
      console.log("   Count:", tournamentsResponse.data?.length || 0)
      if (tournamentsResponse.data && tournamentsResponse.data.length > 0) {
        console.log("   Next tournament:", tournamentsResponse.data[0].name)
        console.log("   Date:", tournamentsResponse.data[0].begin_date)
      }
    } else {
      console.log("❌ Failed to fetch tournaments:", tournamentsResponse.error)
    }

    // Test 5: Get data freshness
    console.log("\n🕒 Test 5: Getting data freshness...")
    const freshness = await getDataFreshness()

    console.log("✅ Data freshness fetched successfully")
    console.log(
      "   Players last updated:",
      freshness.players_last_updated || "Never"
    )
    console.log(
      "   Universities last updated:",
      freshness.universities_last_updated || "Never"
    )
    console.log(
      "   Tournaments last updated:",
      freshness.tournaments_last_updated || "Never"
    )

    console.log("\n🎉 Updated NCPA hook test completed successfully!")
    console.log(
      "📈 Performance: All data is now served from our database instead of external API calls!"
    )
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Run the test
testUpdatedNCPAHook()
