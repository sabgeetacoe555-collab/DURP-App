const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

console.log("Environment check:")
console.log("SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
console.log("SUPABASE_KEY:", supabaseKey ? "✅ Set" : "❌ Missing")

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testStorage() {
  try {
    console.log("\nTesting Supabase Storage...")
    console.log("URL:", supabaseUrl)

    // Test authentication first
    console.log("\nTesting authentication...")
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.log(
        "Auth error (this might be normal for anon key):",
        authError.message
      )
    } else {
      console.log("✅ Authentication successful")
    }

    // Skip bucket listing since anon key might not have permission
    console.log(
      "\nSkipping bucket listing (anon key might not have permission)"
    )
    console.log("Testing direct upload to attachments bucket...")

    // Test upload permissions directly
    console.log("\nTesting upload permissions...")

    // Create a test file
    const testContent = "Hello World"
    const testFileName = `test-${Date.now()}.txt`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(`test/${testFileName}`, testContent, {
        contentType: "text/plain",
        upsert: false,
      })

    if (uploadError) {
      console.error("❌ Upload test failed:", uploadError)
      if (uploadError.message.includes("not found")) {
        console.log("This suggests the 'attachments' bucket doesn't exist")
        console.log("Please create it in your Supabase dashboard")
      } else if (uploadError.message.includes("policy")) {
        console.log("This suggests RLS policies are blocking the upload")
        console.log("The bucket exists but needs proper permissions")
      }
      return
    }

    console.log("✅ Upload test successful:", uploadData)
    console.log("✅ Attachments bucket exists and is accessible!")

    // Test getting public URL
    console.log("\nTesting public URL generation...")
    const { data: urlData } = supabase.storage
      .from("attachments")
      .getPublicUrl(`test/${testFileName}`)

    console.log("✅ Public URL generated:", urlData.publicUrl)

    // Clean up test file
    console.log("\nCleaning up test file...")
    const { error: deleteError } = await supabase.storage
      .from("attachments")
      .remove([`test/${testFileName}`])

    if (deleteError) {
      console.error("Warning: Could not delete test file:", deleteError)
    } else {
      console.log("✅ Test file cleaned up")
    }

    console.log("\n🎉 Storage bucket test completed successfully!")
    console.log("Your attachments bucket is properly configured.")
  } catch (error) {
    console.error("Test failed:", error)
  }
}

testStorage()
