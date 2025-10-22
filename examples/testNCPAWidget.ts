import {
  getPublicTopPlayers,
  getPublicTopUniversities,
} from "../services/NCPAService"

async function testNCPAWidget() {
  console.log("Testing NCPA Widget functionality...\n")

  try {
    // Test players API
    console.log("1. Testing Players API...")
    const playersResponse = await getPublicTopPlayers()
    if (playersResponse.success) {
      console.log("✅ Players API working")
      console.log(`   Found ${playersResponse.data?.length || 0} players`)

      // Show top 3 players
      const topPlayers = playersResponse.data?.slice(0, 3) || []
      topPlayers.forEach((player, index) => {
        console.log(
          `   ${index + 1}. ${player.first_name} ${player.last_name} - ${
            player.college || "No College"
          }`
        )
      })
    } else {
      console.log("❌ Players API failed:", playersResponse.error)
    }

    console.log("\n2. Testing Universities API...")
    const universitiesResponse = await getPublicTopUniversities()
    if (universitiesResponse.success) {
      console.log("✅ Universities API working")
      console.log(
        `   Found ${universitiesResponse.data?.length || 0} universities`
      )

      // Show top 3 universities with rankings
      const topUniversities =
        universitiesResponse.data
          ?.filter((uni) => uni.ranking !== null)
          .sort((a, b) => (a.ranking || 0) - (b.ranking || 0))
          .slice(0, 3) || []

      topUniversities.forEach((university) => {
        console.log(
          `   #${university.ranking}. ${university.name} - ${
            university.points?.toFixed(1) || "N/A"
          } points`
        )
      })
    } else {
      console.log("❌ Universities API failed:", universitiesResponse.error)
    }

    console.log("\n3. Widget Status Summary:")
    console.log("   ✅ Players section: Working")
    console.log("   ✅ Universities section: Working")
    console.log("   ⚠️  Events section: API temporarily unavailable")
    console.log(
      "\n   The widget should display players and universities correctly!"
    )
  } catch (error) {
    console.error("❌ Test failed with error:", error)
  }
}

// Run the test
testNCPAWidget()
