#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

async function deployPickleAIAPI() {
  try {
    console.log("🚀 Deploying PickleAI API Edge Function...")

    // Check if .env file exists
    const envPath = path.join(process.cwd(), ".env")
    if (!fs.existsSync(envPath)) {
      console.error(
        "❌ .env file not found. Please create one with your environment variables."
      )
      process.exit(1)
    }

    // Read .env file
    const envContent = fs.readFileSync(envPath, "utf8")

    // Check for required environment variables
    const requiredVars = [
      "EXPO_PUBLIC_SUPABASE_URL",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY",
      "OPENAI_API_KEY",
    ]

    const missingVars = requiredVars.filter((varName) => {
      return !envContent.includes(`${varName}=`)
    })

    if (missingVars.length > 0) {
      console.error(
        `❌ Missing required environment variables: ${missingVars.join(", ")}`
      )
      console.error("Please add them to your .env file.")
      process.exit(1)
    }

    // Set environment variables in Supabase
    console.log("📝 Setting environment variables...")
    execSync("supabase secrets set --env-file .env", { stdio: "inherit" })

    // Deploy the edge function
    console.log("🔧 Deploying edge function...")
    execSync("supabase functions deploy pickleai-api", { stdio: "inherit" })

    console.log("✅ PickleAI API deployed successfully!")
    console.log("")
    console.log("📋 Next steps:")
    console.log("1. Test the API endpoint")
    console.log("2. Update your app to use the secure service")
    console.log("3. Monitor logs: supabase functions logs pickleai-api")
  } catch (error) {
    console.error("❌ Deployment failed:", error.message)
    process.exit(1)
  }
}

// Run deployment
deployPickleAIAPI()
