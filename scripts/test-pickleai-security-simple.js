#!/usr/bin/env node

// Simplified test script for PickleAI security patterns
// This tests the regex patterns and logic without importing TypeScript files

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
]

// Detection patterns (same as in the security service)
const DENIED_PATTERNS = [
  // XP, streaks, leaderboards
  /(xp|streak|leaderboard).*(formula|hack|cheat|bypass|exploit|farm|optimize|reverse)/i,
  /(formula|hack|cheat|bypass|exploit|farm|optimize|reverse).*(xp|streak|leaderboard)/i,

  // Business model, monetization
  /business model|monetization|monetize|pricing|ltv|cac|growth|go to market/i,

  // Scraping, export, database access
  /scrape|export|dump|database|sql|query|endpoint list|api key|token|admin|analytics/i,

  // Security, vulnerabilities
  /security|vulnerability|penetration|jailbreak|prompt injection|guardrail/i,

  // Private, confidential information
  /private|confidential|internal|roadmap|strategy doc|investor deck/i,
]

// Simple security check function
function checkMessageSecurity(message) {
  const lowerMessage = message.toLowerCase()

  // Check for denied patterns
  for (const pattern of DENIED_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      return {
        allowed: false,
        reason: "Topic not allowed",
        pattern: pattern.toString(),
      }
    }
  }

  return { allowed: true }
}

// Test content redaction
function testContentRedaction() {
  console.log("\n🔍 Testing Content Redaction...\n")

  const testContent = [
    "Here's your API key: sk-1234567890abcdef1234567890abcdef1234567890abcdef",
    "Contact me at john.doe@example.com for more information",
    "My SSN is 123-45-6789",
    "Access the admin panel at /admin/dashboard",
    "Normal pickleball content with no sensitive information",
  ]

  testContent.forEach((content, index) => {
    let redacted = content

    // Redact API keys, tokens, etc.
    redacted = redacted.replace(/\b[A-Za-z0-9]{32,}\b/g, "[REDACTED]")
    redacted = redacted.replace(
      /\b[A-Za-z0-9]{20,}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
      "[EMAIL_REDACTED]"
    )
    redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN_REDACTED]")
    redacted = redacted.replace(
      /\b(admin|internal|private)\/[^\s]+\b/gi,
      "[PATH_REDACTED]"
    )

    console.log(`Test ${index + 1}:`)
    console.log(`  Original: ${content}`)
    console.log(`  Redacted: ${redacted}`)
    console.log("")
  })
}

async function testSecurityPatterns() {
  console.log("🔒 Testing PickleAI Security Patterns...\n")

  let passedTests = 0
  let totalTests = testCases.length

  for (const testCase of testCases) {
    try {
      // Test the security check
      const result = checkMessageSecurity(testCase.message)

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
        if (result.pattern) {
          console.log(`   Pattern: ${result.pattern}`)
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
    console.log("🎉 All security pattern tests passed!")
  } else {
    console.log(
      "⚠️  Some security pattern tests failed. Please review the implementation."
    )
  }
}

// Main test function
async function runAllTests() {
  try {
    await testSecurityPatterns()
    testContentRedaction()

    console.log("\n✅ All security tests completed!")
    console.log("\n📋 Next steps:")
    console.log("1. Deploy the edge function: npm run deploy:pickleai")
    console.log("2. Test the full implementation in your app")
    console.log("3. Monitor logs: supabase functions logs pickleai-api")
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
  testSecurityPatterns,
  testContentRedaction,
  runAllTests,
  checkMessageSecurity,
}
