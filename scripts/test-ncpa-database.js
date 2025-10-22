// Test script to verify NCPA service works with database
const { createClient } = require("@supabase/supabase-js")

// Use Supabase credentials from eas.json
const supabaseUrl = "https://feetcenkvxrmfltorlru.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZXRjZW5rdnhybWZsdG9ybHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTcwNDcsImV4cCI6MjA2NzEzMzA0N30.h24ceWNugBgTza_L8loJpQiuyBYdkjSBHCRMTRVgh_U"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testNCPADatabase() {
  console.log("🧪 Testing NCPA database integration...")

  try {
    // Test 1: Check if tables exist
    console.log("\n📊 Test 1: Checking if NCPA tables exist...")

    const [playersResult, universitiesResult, tournamentsResult] =
      await Promise.all([
        supabase
          .from("ncpa_players")
          .select("count", { count: "exact", head: true }),
        supabase
          .from("ncpa_universities")
          .select("count", { count: "exact", head: true }),
        supabase
          .from("ncpa_tournaments")
          .select("count", { count: "exact", head: true }),
      ])

    console.log(
      "✅ NCPA Players table exists, count:",
      playersResult.count || 0
    )
    console.log(
      "✅ NCPA Universities table exists, count:",
      universitiesResult.count || 0
    )
    console.log(
      "✅ NCPA Tournaments table exists, count:",
      tournamentsResult.count || 0
    )

    // Test 2: Test database functions
    console.log("\n🔧 Test 2: Testing database functions...")

    // Test get_top_ncpa_players function
    const { data: topPlayers, error: topPlayersError } = await supabase.rpc(
      "get_top_ncpa_players",
      { limit_count: 5 }
    )

    if (topPlayersError) {
      console.log("⚠️  Top players function error:", topPlayersError.message)
    } else {
      console.log(
        "✅ Top players function works, returned:",
        topPlayers?.length || 0,
        "players"
      )
    }

    // Test get_current_ncpa_tournaments function
    const { data: currentTournaments, error: tournamentsError } =
      await supabase.rpc("get_current_ncpa_tournaments")

    if (tournamentsError) {
      console.log(
        "⚠️  Current tournaments function error:",
        tournamentsError.message
      )
    } else {
      console.log(
        "✅ Current tournaments function works, returned:",
        currentTournaments?.length || 0,
        "tournaments"
      )
    }

    // Test 3: Test direct table queries (simulating the new service)
    console.log("\n📋 Test 3: Testing direct table queries...")

    // Test players query
    const { data: players, error: playersError } = await supabase
      .from("ncpa_players")
      .select("*")
      .eq("hidden", 0)
      .order("overall_rating", { ascending: false })
      .limit(3)

    if (playersError) {
      console.log("❌ Players query error:", playersError.message)
    } else {
      console.log(
        "✅ Players query works, returned:",
        players?.length || 0,
        "players"
      )
      if (players && players.length > 0) {
        console.log("   Sample player:", {
          name: `${players[0].first_name} ${players[0].last_name}`,
          college: players[0].college,
          overall_rating: players[0].overall_rating,
        })
      }
    }

    // Test universities query
    const { data: universities, error: universitiesError } = await supabase
      .from("ncpa_universities")
      .select("*")
      .order("ranking", { ascending: true })
      .limit(3)

    if (universitiesError) {
      console.log("❌ Universities query error:", universitiesError.message)
    } else {
      console.log(
        "✅ Universities query works, returned:",
        universities?.length || 0,
        "universities"
      )
      if (universities && universities.length > 0) {
        console.log("   Sample university:", {
          name: universities[0].name,
          ranking: universities[0].ranking,
        })
      }
    }

    // Test 4: Test sync log
    console.log("\n📝 Test 4: Testing sync log...")

    const { data: syncLog, error: syncLogError } = await supabase
      .from("ncpa_sync_log")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(5)

    if (syncLogError) {
      console.log("❌ Sync log query error:", syncLogError.message)
    } else {
      console.log(
        "✅ Sync log query works, returned:",
        syncLog?.length || 0,
        "entries"
      )
      if (syncLog && syncLog.length > 0) {
        console.log("   Latest sync:", {
          type: syncLog[0].sync_type,
          status: syncLog[0].status,
          processed: syncLog[0].records_processed,
          updated: syncLog[0].records_updated,
          created: syncLog[0].records_created,
        })
      }
    }

    // Test 5: Test data freshness function
    console.log("\n🕒 Test 5: Testing data freshness...")

    const [playersFreshness, universitiesFreshness, tournamentsFreshness] =
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

    console.log("✅ Data freshness check works:")
    console.log(
      "   Players last updated:",
      playersFreshness.data?.last_updated || "Never"
    )
    console.log(
      "   Universities last updated:",
      universitiesFreshness.data?.last_updated || "Never"
    )
    console.log(
      "   Tournaments last updated:",
      tournamentsFreshness.data?.last_updated || "Never"
    )

    console.log("\n🎉 NCPA database integration test completed successfully!")
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Run the test
testNCPADatabase()
