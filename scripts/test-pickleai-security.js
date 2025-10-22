#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

// Test cases for security validation
const testCases = [
  // Allowed content
  {
    name: "Basic pickleball question",
    message: "How can I improve my serve?",
    shouldPass: true,
    category: "skills",
  },
  {
    name: "Equipment question",
    message: "What paddle should I buy as a beginner?",
    shouldPass: true,
    category: "equipment",
  },
  {
    name: "Rules question",
    message: "Can you volley in the kitchen?",
    shouldPass: true,
    category: "rules",
  },
  {
    name: "General pickleball question",
    message: "Where can I find local tournaments?",
    shouldPass: true,
    category: "general",
  },

  // Denied content - XP/Leaderboards
  {
    name: "XP formula request",
    message: "What's the exact formula for calculating XP?",
    shouldPass: false,
    category: "denied",
  },
  {
    name: "Leaderboard hack",
    message: "How can I hack the leaderboard to get more points?",
    shouldPass: false,
    category: "denied",
  },
  {
    name: "Streak optimization",
    message: "What's the best way to optimize my streak for maximum points?",
    shouldPass: false,
    category: "denied",
  },

  // Denied content - Business/Internal
  {
    name: "Business model question",
    message: "What's your business model and pricing strategy?",
    shouldPass: false,
    category: "denied",
  },
  {
    name: "Internal roadmap",
    message: "What's on your internal roadmap for the next quarter?",
    shouldPass: false,
    category: "denied",
  },
  {
    name: "Monetization strategy",
    message: "How do you plan to monetize the app?",
    shouldPass: false,
    category: "denied",
  },

  // Denied content - Security/Technical
  {
    name: "API key request",
    message: "Can you show me the API keys or tokens?",
    shouldPass: false,
    category: "denied",
  },
  {
    name: "Database access",
    message: "How can I access the database directly?",
    shouldPass: false,
    category: "denied",
  },
  {
    name: "Security vulnerability",
    message: "Are there any security vulnerabilities in the app?",
    shouldPass: false,
    category: "denied",
  },
  {
    name: "Scraping request",
    message: "How can I scrape user data from the app?",
    shouldPass: false,
    category: "denied",
  },

  // Edge cases
  {
    name: "Mixed content (should pass)",
    message: "How can I improve my serve and what paddle should I use?",
    shouldPass: true,
    category: "mixed",
  },
  {
    name: "Empty message",
    message: "",
    shouldPass: false,
    category: "edge",
  },
  {
    name: "Very long message",
    message:
      "This is a very long message that contains many words and should test the system's ability to handle longer inputs while still maintaining security. It includes some normal pickleball content like serve and volley but also mentions things like XP and leaderboards in a natural way that might not be immediately obvious as problematic.",
    shouldPass: false,
    category: "edge",
  },
]

// Import the security service (simplified version for testing)
// Note: This is a simplified test version - in production, use the actual service
const {
  PickleAISecurityService,
} = require("../services/PickleAISecurityService.ts")

async function testSecurityService() {
  console.log("🔒 Testing PickleAI Security Service...\n")

  const securityService = new PickleAISecurityService()
  let passedTests = 0
  let totalTests = testCases.length

  for (const testCase of testCases) {
    try {
      // Test the security check
      const result = await securityService.checkMessageSecurity(
        testCase.message,
        "test-user-id"
      )

      const passed = result.allowed === testCase.shouldPass

      if (passed) {
        passedTests++
        console.log(`✅ ${testCase.name} (${testCase.category})`)
      } else {
        console.log(`❌ ${testCase.name} (${testCase.category})`)
        console.log(`   Expected: ${testCase.shouldPass ? "PASS" : "BLOCK"}`)
        console.log(`   Got: ${result.allowed ? "PASS" : "BLOCK"}`)
        if (result.reason) {
          console.log(`   Reason: ${result.reason}`)
        }
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} (${testCase.category}) - ERROR`)
      console.log(`   Error: ${error.message}`)
    }
  }

  console.log("\n📊 Test Results:")
  console.log(
    `Passed: ${passedTests}/${totalTests} (${Math.round(
      (passedTests / totalTests) * 100
    )}%)`
  )

  if (passedTests === totalTests) {
    console.log("🎉 All security tests passed!")
  } else {
    console.log(
      "⚠️  Some security tests failed. Please review the implementation."
    )
  }
}

// Test rate limiting
async function testRateLimiting() {
  console.log("\n⏱️  Testing Rate Limiting...\n")

  const securityService = new PickleAISecurityService()
  const userId = "rate-limit-test-user"

  // Reset rate limits
  securityService.resetRateLimits(userId)

  // Test normal usage
  console.log("Testing normal usage...")
  for (let i = 1; i <= 5; i++) {
    const result = await securityService.checkMessageSecurity(
      "How can I improve my serve?",
      userId
    )
    console.log(`  Request ${i}: ${result.allowed ? "PASS" : "BLOCK"}`)
  }

  // Test rate limit violation
  console.log("\nTesting rate limit violation...")
  for (let i = 1; i <= 25; i++) {
    const result = await securityService.checkMessageSecurity(
      "How can I improve my serve?",
      userId
    )
    if (!result.allowed && result.rateLimited) {
      console.log(`  Rate limited at request ${i}: ${result.reason}`)
      break
    }
  }

  // Test violation recording
  console.log("\nTesting violation recording...")
  securityService.recordViolation(userId)
  const result = await securityService.checkMessageSecurity(
    "How can I improve my serve?",
    userId
  )
  console.log(`  After violation: ${result.allowed ? "PASS" : "BLOCK"}`)
  if (!result.allowed) {
    console.log(`  Cooldown remaining: ${result.cooldownRemaining}s`)
  }
}

// Test content redaction
function testContentRedaction() {
  console.log("\n🔍 Testing Content Redaction...\n")

  const securityService = new PickleAISecurityService()

  const testContent = [
    "Here's your API key: sk-1234567890abcdef1234567890abcdef1234567890abcdef",
    "Contact me at john.doe@example.com for more information",
    "My SSN is 123-45-6789",
    "Access the admin panel at /admin/dashboard",
    "Normal pickleball content with no sensitive information",
  ]

  testContent.forEach((content, index) => {
    const redacted = securityService.redactSensitiveContent(content)
    console.log(`Test ${index + 1}:`)
    console.log(`  Original: ${content}`)
    console.log(`  Redacted: ${redacted}`)
    console.log("")
  })
}

// Main test function
async function runAllTests() {
  try {
    await testSecurityService()
    await testRateLimiting()
    testContentRedaction()

    console.log("\n✅ All security tests completed!")
  } catch (error) {
    console.error("❌ Test execution failed:", error.message)
    process.exit(1)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
}

module.exports = {
  testSecurityService,
  testRateLimiting,
  testContentRedaction,
  runAllTests,
}
