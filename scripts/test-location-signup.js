// Test script to verify location data is properly saved during signup
const { createClient } = require("@supabase/supabase-js")

// Use Supabase credentials from eas.json
const supabaseUrl = "https://feetcenkvxrmfltorlru.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZXRjZW5rdnhybWZsdG9ybHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTcwNDcsImV4cCI6MjA2NzEzMzA0N30.h24ceWNugBgTza_L8loJpQiuyBYdkjSBHCRMTRVgh_U"

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLocationSignup() {
  console.log("🧪 Testing location data during signup...")

  try {
    // Test data
    const testEmail = `test-location-${Date.now()}@example.com`
    const testPassword = "testpassword123"
    const testName = "Location Test User"
    const testLocation = {
      latitude: 37.7749,
      longitude: -122.4194,
      address: "123 Test Street, San Francisco, CA",
      displayAddress: "San Francisco, CA",
    }

    console.log("📧 Creating test user with location data...")
    console.log("   Email:", testEmail)
    console.log("   Name:", testName)
    console.log("   Location:", testLocation)

    // Sign up the user
    const { data: signupData, error: signupError } = await supabase.auth.signUp(
      {
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: testName,
          },
        },
      }
    )

    if (signupError) {
      console.error("❌ Signup error:", signupError)
      return
    }

    console.log("✅ User created successfully")
    console.log("   User ID:", signupData.user.id)

    // Wait a moment for the trigger to create the user profile
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if user profile was created
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", signupData.user.id)
      .single()

    if (profileError) {
      console.error("❌ Error fetching user profile:", profileError)
      return
    }

    console.log("✅ User profile created:")
    console.log("   ID:", userProfile.id)
    console.log("   Email:", userProfile.email)
    console.log("   Name:", userProfile.name)
    console.log("   Location Point:", userProfile.location_point)
    console.log("   Location Address:", userProfile.location_address)
    console.log(
      "   Location Display Address:",
      userProfile.location_display_address
    )

    // Now test updating location data
    console.log("\n📍 Testing location update...")

    const locationPoint = `POINT(${testLocation.longitude} ${testLocation.latitude})`

    const { error: locationError } = await supabase.rpc(
      "update_user_location",
      {
        user_id: signupData.user.id,
        location_point: locationPoint,
        location_address: testLocation.address,
        location_display_address: testLocation.displayAddress,
      }
    )

    if (locationError) {
      console.error("❌ Error updating location:", locationError)
      return
    }

    console.log("✅ Location updated successfully")

    // Verify the location was saved
    const { data: updatedProfile, error: updateError } = await supabase
      .from("users")
      .select("*")
      .eq("id", signupData.user.id)
      .single()

    if (updateError) {
      console.error("❌ Error fetching updated profile:", updateError)
      return
    }

    console.log("✅ Updated user profile:")
    console.log("   Location Point:", updatedProfile.location_point)
    console.log("   Location Address:", updatedProfile.location_address)
    console.log(
      "   Location Display Address:",
      updatedProfile.location_display_address
    )
    console.log("   Location Updated At:", updatedProfile.location_updated_at)

    // Clean up - delete the test user
    console.log("\n🧹 Cleaning up test user...")
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      signupData.user.id
    )

    if (deleteError) {
      console.error("⚠️  Warning: Could not delete test user:", deleteError)
    } else {
      console.log("✅ Test user deleted successfully")
    }

    console.log("\n🎉 Location signup test completed successfully!")
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Run the test
testLocationSignup()
