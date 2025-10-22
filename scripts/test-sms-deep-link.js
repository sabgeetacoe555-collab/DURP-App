#!/usr/bin/env node

/**
 * Test script to generate a test SMS deep link
 * This helps test the deep link routing without database complications
 */

console.log("🧪 Testing SMS Deep Link Flow...\n")

// Generate a test session ID (using valid UUID format for testing)
const testSessionId =
  "00000000-0000-4000-8000-" + Date.now().toString().padStart(12, "0")
const testPhone = "+15551234567" // Replace with your actual phone number

// Step 1: Generate the deep link (using main page with query params)
console.log("1️⃣ Generating test deep link...")
const deepLink = `https://www.netgains.app/?sessionId=${testSessionId}&phone=${encodeURIComponent(
  testPhone
)}&invite=true`

console.log("🔗 Deep Link (Main Page):")
console.log(deepLink)
console.log("\n📱 App Scheme (for dev build):")
console.log(
  `netgains://session/${testSessionId}?phone=${encodeURIComponent(
    testPhone
  )}&invite=true`
)

// Step 2: Test the flow
console.log("\n2️⃣ Testing Flow:")
console.log("• Copy the deep link above")
console.log("• Open it in your browser on your iOS device")
console.log("• It should load your main page with session parameters")
console.log("• Your page should detect the parameters and try to open the app")
console.log("• If no app, it should show install prompt")

// Step 3: What to expect
console.log("\n3️⃣ What Should Happen:")
console.log("✅ Deep link opens main page (no 404)")
console.log("✅ Page detects sessionId, phone, and invite parameters")
console.log("✅ Page tries to open your dev build using 'netgains://' scheme")
console.log("✅ Dev build opens (if installed)")
console.log("✅ Routes to session invite response screen")

console.log("\n🎯 Test Complete!")
console.log("Copy the deep link above and test it on your iOS device!")
console.log("This should work with your current website structure.")
console.log(
  "Make sure your landing page uses 'netgains://' scheme to open the app."
)
console.log(
  "\n💡 Note: Your dev build uses scheme 'netgains://' (from app.json)"
)
console.log(
  "💡 Your website should try to open: netgains://session/{sessionId}?phone={phone}&invite=true"
)
