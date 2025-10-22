#!/usr/bin/env node

// Test DUPR authentication directly with environment variables
const https = require("https")

function makeRequest(url, method = "POST", data = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "NetGains-DUPR-Test/1.0",
        ...extraHeaders,
      },
    }

    const req = https.request(options, (res) => {
      let body = ""

      res.on("data", (chunk) => {
        body += chunk
      })

      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body,
        })
      })
    })

    req.on("error", (error) => {
      reject(error)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// Test DUPR authentication with the credentials from the summary
async function testDuprAuth() {
  console.log("🔍 Testing DUPR Authentication with Summary Credentials...\n")

  const baseUrl = "https://uat.mydupr.com/api"
  
  // Credentials from DUPR_SUPPORT_SUMMARY.md
  const credentials = {
    clientKey: "test-ck-424f795f-f6d1-4220-f824-ae7ba1ae62d4",
    clientSecret: "test-cs-7a5bd1125c7b4b7cfc1aeb009d3c9e57",
    clientId: "5208543024",
    clientName: "Net Gains"
  }

  console.log("📋 Using credentials:", {
    clientKey: credentials.clientKey,
    clientSecret: "***" + credentials.clientSecret.slice(-4),
    clientId: credentials.clientId,
    clientName: credentials.clientName
  })

  // Test 1: Client credentials flow
  console.log("\n🧪 Test 1: Client Credentials Flow")
  const endpoint1 = "/auth/v3.0/token"
  const url1 = `${baseUrl}${endpoint1}`

  // Base64 encode the credentials
  const encodedCredentials = Buffer.from(
    `${credentials.clientKey}:${credentials.clientSecret}`
  ).toString("base64")

  const headers1 = {
    "Content-Type": "application/json",
    "x-authorization": encodedCredentials,
  }

  try {
    const response1 = await makeRequest(url1, "POST", {}, headers1)
    console.log(`Status: ${response1.status}`)
    console.log(`Response: ${response1.status}`)

    if (response1.status === 200) {
      console.log("✅ SUCCESS! Client credentials flow worked!")
      const data = JSON.parse(response1.body)
      console.log("Token data:", JSON.stringify(data, null, 2))
    } else {
      console.log("❌ Client credentials flow failed")
    }
  } catch (error) {
    console.log(`Error: ${error.message}`)
  }

  // Test 2: User authentication
  console.log("\n🧪 Test 2: User Authentication")
  const endpoint2 = "/auth/v3.0/login"
  const url2 = `${baseUrl}${endpoint2}`

  const headers2 = {
    "Content-Type": "application/json",
    "X-API-Key": credentials.clientKey,
    "X-Client-ID": credentials.clientId,
    "X-Client-Name": credentials.clientName,
  }

  const userData = {
    email: "chris.chidgey@toptal.com",
    password: "Test@123!",
  }

  try {
    const response2 = await makeRequest(url2, "POST", userData, headers2)
    console.log(`Status: ${response2.status}`)
    console.log(`Response: ${response2.body}`)

    if (response2.status === 200) {
      console.log("✅ SUCCESS! User authentication worked!")
      const data = JSON.parse(response2.body)
      console.log("User data:", JSON.stringify(data, null, 2))
    } else {
      console.log("❌ User authentication failed")
    }
  } catch (error) {
    console.log(`Error: ${error.message}`)
  }

  // Test 3: Alternative endpoint
  console.log("\n🧪 Test 3: Alternative Token Endpoint")
  const endpoint3 = "/token"
  const url3 = `${baseUrl}${endpoint3}`

  const headers3 = {
    "Content-Type": "application/json",
    "x-authorization": encodedCredentials,
  }

  try {
    const response3 = await makeRequest(url3, "POST", {}, headers3)
    console.log(`Status: ${response3.status}`)
    console.log(`Response: ${response3.body}`)

    if (response3.status === 200) {
      console.log("✅ SUCCESS! Alternative token endpoint worked!")
      const data = JSON.parse(response3.body)
      console.log("Token data:", JSON.stringify(data, null, 2))
    } else {
      console.log("❌ Alternative token endpoint failed")
    }
  } catch (error) {
    console.log(`Error: ${error.message}`)
  }
}

// Run test
async function runTest() {
  console.log("🚀 Starting DUPR Direct Authentication Test...\n")

  await testDuprAuth()

  console.log("\n✨ Test completed!")
}

runTest().catch(console.error) 