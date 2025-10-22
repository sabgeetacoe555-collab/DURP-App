#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const readline = require("readline")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.log("🚀 DUPR API Setup Script")
console.log("========================\n")

console.log("This script will help you set up DUPR API integration.\n")

console.log("📋 Prerequisites:")
console.log("1. DUPR API credentials (Client ID, Client Key, Client Secret)")
console.log("2. Supabase CLI installed and configured")
console.log("3. Access to your Supabase project\n")

console.log(
  "📚 Get DUPR credentials from: https://uat.mydupr.com/api/swagger-ui/index.html\n"
)

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve))

async function setupDupr() {
  try {
    // Check if .env file exists
    const envPath = path.join(process.cwd(), ".env")
    let envContent = ""

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8")
      console.log("✅ Found existing .env file")
    } else {
      console.log("📝 Creating new .env file")
    }

    // Get DUPR credentials from user
    console.log("\n🔑 Enter your DUPR API credentials:\n")

    const baseUrl =
      (await question(
        "DUPR Base URL (default: https://uat.mydupr.com/api): "
      )) || "https://uat.mydupr.com/api"
    const version =
      (await question("DUPR API Version (default: v3.0): ")) || "v3.0"
    const clientName = await question("DUPR Client Name: ")
    const clientId = await question("DUPR Client ID: ")
    const clientKey = await question("DUPR Client Key: ")
    const clientSecret = await question("DUPR Client Secret: ")

    if (!clientName || !clientId || !clientKey || !clientSecret) {
      console.log("\n❌ Error: All DUPR credentials are required!")
      rl.close()
      return
    }

    // Build new environment variables
    const newEnvVars = [
      `DUPR_BASE_URL=${baseUrl}`,
      `DUPR_VERSION=${version}`,
      `DUPR_CLIENT_NAME=${clientName}`,
      `DUPR_CLIENT_ID=${clientId}`,
      `DUPR_CLIENT_KEY=${clientKey}`,
      `DUPR_CLIENT_SECRET=${clientSecret}`,
    ].join("\n")

    // Update .env file
    const lines = envContent.split("\n")
    const existingVars = [
      "DUPR_BASE_URL",
      "DUPR_VERSION",
      "DUPR_CLIENT_NAME",
      "DUPR_CLIENT_ID",
      "DUPR_CLIENT_KEY",
      "DUPR_CLIENT_SECRET",
    ]

    // Remove existing DUPR variables
    const filteredLines = lines.filter((line) => {
      return !existingVars.some((varName) => line.startsWith(varName + "="))
    })

    // Add new DUPR variables
    const updatedContent = filteredLines.join("\n") + "\n" + newEnvVars

    // Write to .env file
    fs.writeFileSync(envPath, updatedContent)
    console.log("\n✅ Updated .env file with DUPR credentials")

    // Ask if user wants to deploy to Supabase
    const deployToSupabase = await question(
      "\n🚀 Deploy environment variables to Supabase? (y/n): "
    )

    if (
      deployToSupabase.toLowerCase() === "y" ||
      deployToSupabase.toLowerCase() === "yes"
    ) {
      console.log("\n📤 Deploying to Supabase...")

      try {
        const { execSync } = require("child_process")
        execSync("supabase secrets set --env-file .env", { stdio: "inherit" })
        console.log(
          "\n✅ Successfully deployed environment variables to Supabase"
        )

        const deployFunction = await question(
          "\n🔄 Deploy DUPR edge function? (y/n): "
        )

        if (
          deployFunction.toLowerCase() === "y" ||
          deployFunction.toLowerCase() === "yes"
        ) {
          console.log("\n📤 Deploying DUPR edge function...")
          execSync("supabase functions deploy dupr-api", { stdio: "inherit" })
          console.log("\n✅ Successfully deployed DUPR edge function")
        }
      } catch (error) {
        console.log("\n❌ Error deploying to Supabase:", error.message)
        console.log("Please run these commands manually:")
        console.log("  supabase secrets set --env-file .env")
        console.log("  supabase functions deploy dupr-api")
      }
    }

    console.log("\n🎉 DUPR setup complete!")
    console.log("\n📱 Next steps:")
    console.log("1. Test the connection in your app (Widgets tab)")
    console.log(
      "2. Check the logs if there are issues: supabase functions logs dupr-api"
    )
    console.log("3. Implement user authentication flow")
    console.log("\n📚 Documentation: docs/DUPR_SETUP.md")
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message)
  } finally {
    rl.close()
  }
}

setupDupr()
