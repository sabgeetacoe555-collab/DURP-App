// services/IntelligentPromptService.ts

export interface UserContext {
  experience?: "beginner" | "intermediate" | "advanced" | "unknown"
  budget?: string
  playFrequency?: "casual" | "weekly" | "daily" | "competitive"
  playStyle?: "power" | "control" | "balanced" | "spin" | "unknown"
  physicalConsiderations?: string
  goals?: string[]
  preferences?: Record<string, any>
  location?: {
    city?: string
    state?: string
    zipCode?: string
    coordinates?: { lat: number; lng: number }
  }
  travelDistance?: "local" | "25_miles" | "50_miles" | "100_miles" | "anywhere"
  skillLevel?: "recreational" | "3.0" | "3.5" | "4.0" | "4.5" | "5.0+"
  tournamentPreference?: "recreational" | "competitive" | "any"
  datePreference?:
    | "this_weekend"
    | "next_week"
    | "this_month"
    | "next_month"
    | "flexible"
  currentPaddle?: string
  comparisonCriteria?: string[]
  duprScore?: number
  duprGoals?: string[]
  duprIntent?: "personal" | "lookup" | "general"
  playerName?: string
}

export interface QuestionCategory {
  name: string
  keywords: string[]
  requiredInfo: string[]
  optionalInfo: string[]
  followUpQuestions: Record<string, string[]>
  resources?: string[]
}

// Define conversation categories and their requirements
export const conversationCategories: Record<string, QuestionCategory> = {
  skills: {
    name: "Skills & Techniques",
    keywords: [
      "improve",
      "serve",
      "dinking",
      "volley",
      "footwork",
      "technique",
      "practice",
      "drills",
      "smash",
      "backhand",
      "consistency",
      "third shot",
      "warm up",
      "teamwork",
      "mental",
      "focus",
      "mistakes",
      "beginners",
      "alone",
      "opponent",
      "anticipate",
    ],
    requiredInfo: ["experience"],
    optionalInfo: ["specificSkill", "goals", "practiceTime"],
    followUpQuestions: {
      experience: [
        "What's your current skill level - beginner, intermediate, or advanced?",
        "How long have you been playing pickleball?",
      ],
      specificSkill: [
        "Which specific skill would you like to focus on?",
        "What part of your game needs the most work?",
      ],
      goals: [
        "What are your pickleball goals?",
        "Are you preparing for tournaments or just improving for fun?",
      ],
    },
  },

  rules: {
    name: "Rules & Regulations",
    keywords: [
      "rule",
      "kitchen",
      "non-volley",
      "pickle-over",
      "score",
      "serving",
      "line",
      "double-bounce",
      "paddle size",
      "specifications",
      "tiebreaker",
      "fault",
      "singles",
      "doubles",
      "let",
      "court dimensions",
      "timeout",
      "substitution",
      "legal",
      "violation",
    ],
    requiredInfo: ["ruleQuestion"],
    optionalInfo: ["gameContext"],
    followUpQuestions: {
      ruleQuestion: [
        "What specific rule are you asking about?",
        "Can you describe the situation you're wondering about?",
      ],
      gameContext: [
        "Is this for tournament or casual play?",
        "Are you playing singles or doubles?",
      ],
    },
  },

  equipment: {
    name: "Equipment",
    keywords: [
      "paddle",
      "racket",
      "equipment",
      "gear",
      "shoes",
      "bag",
      "clothes",
      "wear",
      "recommend",
      "best",
      "choose",
      "grip size",
      "materials",
      "replace",
      "balls",
      "outdoor",
    ],
    requiredInfo: ["equipmentType", "budget"],
    optionalInfo: ["experience", "playFrequency"],
    followUpQuestions: {
      equipmentType: [
        "What specific equipment are you looking for?",
        "Are you shopping for paddles, shoes, or other gear?",
      ],
      budget: [
        "What's your budget range?",
        "Are you looking for budget-friendly or premium options?",
      ],
      experience: [
        "What's your skill level?",
        "Are you a beginner or more experienced player?",
      ],
    },
  },

  general: {
    name: "General Pickleball",
    keywords: [
      "injury",
      "prevent",
      "tournament",
      "rating",
      "history",
      "coaching",
      "courts",
      "clubs",
      "beginner",
      "fitness",
      "partner",
      "group",
      "recreational",
      "competitive",
      "weather",
      "popularity",
      "future",
      "ai",
      "analyze",
    ],
    requiredInfo: ["generalQuestion"],
    optionalInfo: ["location", "experience"],
    followUpQuestions: {
      generalQuestion: [
        "What specific aspect of pickleball are you asking about?",
        "Are you looking for information about tournaments, injuries, or something else?",
      ],
      location: [
        "What's your location?",
        "Where are you looking for courts or tournaments?",
      ],
      experience: [
        "What's your experience level?",
        "Are you new to pickleball or more experienced?",
      ],
    },
  },

  paddleRecommendation: {
    name: "Paddle Recommendation",
    keywords: [
      "paddle",
      "racket",
      "equipment",
      "what paddle",
      "recommend paddle",
      "best paddle",
    ],
    requiredInfo: ["experience", "budget"],
    optionalInfo: ["playFrequency", "playStyle", "physicalConsiderations"],
    followUpQuestions: {
      budget: [
        "What's your budget range for a paddle?",
        "Are you looking to spend under $50, $50-100, $100-150, or $150+?",
        "Do you have a specific price range in mind?",
      ],
      experience: [
        "How would you describe your pickleball experience level?",
        "Are you completely new to pickleball or have you played before?",
        "Would you consider yourself a beginner, intermediate, or advanced player?",
      ],
      playFrequency: [
        "How often are you planning to play?",
        "Will you be playing casually or more regularly?",
        "Are you looking to play recreationally or competitively?",
      ],
      playStyle: [
        "Do you prefer power shots or more controlled placement?",
        "Are you interested in adding spin to your game?",
        "Do you like to play aggressively at the net or more defensively?",
      ],
      physicalConsiderations: [
        "Do you have any arm, wrist, or shoulder concerns?",
        "Are you looking for a lighter or heavier paddle?",
        "Any physical considerations I should know about?",
      ],
    },
  },

  paddleComparison: {
    name: "Paddle Comparison",
    keywords: [
      "compare",
      "comparison",
      "vs",
      "versus",
      "difference between",
      "which is better",
      "compare paddles",
    ],
    requiredInfo: ["paddlesToCompare", "comparisonCriteria"],
    optionalInfo: ["experience", "currentPaddle", "budget", "playStyle"],
    resources: ["https://www.dinkbase.com"],
    followUpQuestions: {
      paddlesToCompare: [
        "Which specific paddles would you like me to compare?",
        "Do you have 2-3 paddles in mind that you're considering?",
        "What paddles are you trying to choose between?",
      ],
      comparisonCriteria: [
        "What aspects are most important to you - weight, power, control, price, or durability?",
        "Are you looking to compare performance, specs, or value?",
        "What criteria matter most in your decision?",
      ],
      currentPaddle: [
        "What paddle are you currently using?",
        "Are you looking to upgrade from a specific paddle?",
        "Do you have a current paddle you want to compare against?",
      ],
      experience: [
        "What's your skill level - beginner, intermediate, or advanced?",
        "How long have you been playing pickleball?",
        "Would you consider yourself a recreational or competitive player?",
      ],
    },
  },

  duprRating: {
    name: "DUPR Rating System",
    keywords: [
      "dupr",
      "rating",
      "score",
      "ranking",
      "skill level",
      "dynamic rating",
      "universal rating",
    ],
    requiredInfo: ["duprQuestion", "duprIntent"],
    optionalInfo: [
      "duprScore",
      "experience",
      "duprGoals",
      "tournamentPreference",
      "playerName",
    ],
    resources: ["https://dupr.com"],
    followUpQuestions: {
      duprQuestion: [
        "What would you like to know about DUPR - how it works, how to get rated, how to improve your rating, or how to look up someone's rating?",
        "Are you asking about getting your own DUPR rating or looking up another player's rating?",
        "What specific aspect of DUPR interests you - personal rating management or player lookup?",
      ],
      duprIntent: [
        "Are you looking to get your own DUPR rating or find information about another player?",
        "Is this about managing your personal DUPR or researching someone else's rating?",
        "Do you want to work on your own rating or look up a specific player?",
      ],
      playerName: [
        "What's the name of the player you're looking to research?",
        "Which player's DUPR rating are you trying to find?",
        "Who specifically are you looking to research?",
      ],
      duprScore: [
        "What's your current DUPR rating?",
        "Do you already have a DUPR score, or are you looking to get your first rating?",
        "Have you been rated yet on the DUPR system?",
      ],
      duprGoals: [
        "What are your goals with DUPR - tournament eligibility, tracking improvement, or general curiosity?",
        "Are you looking to improve your rating or just understand the system?",
        "What would you like to achieve with your DUPR rating?",
      ],
      experience: [
        "How long have you been playing pickleball?",
        "What's your approximate skill level - recreational, competitive, or somewhere in between?",
        "Do you play in tournaments or mostly recreational games?",
      ],
      tournamentPreference: [
        "Are you interested in tournament play?",
        "Do you play competitively or mostly for fun?",
        "Are you looking to use DUPR for tournament entry?",
      ],
    },
  },

  tournamentFinder: {
    name: "Tournament & Game Finder",
    keywords: [
      "tournament",
      "game",
      "match",
      "when",
      "where",
      "next game",
      "find tournament",
      "events",
      "competition",
    ],
    requiredInfo: ["location", "eventType"],
    optionalInfo: [
      "skillLevel",
      "datePreference",
      "travelDistance",
      "tournamentPreference",
    ],
    resources: [
      "https://pickleballtournaments.com/",
      "https://pickleheads.com",
      "https://usapickleball.org",
      "https://ppatour.com",
    ],
    followUpQuestions: {
      location: [
        "What's your location? (City, State or ZIP code)",
        "Where are you located so I can find nearby events?",
        "What area should I search for tournaments and games?",
      ],
      eventType: [
        "Are you looking for tournaments, casual games, or both?",
        "Do you want competitive tournaments or recreational play opportunities?",
        "What type of events interest you - tournaments, leagues, or pickup games?",
      ],
      skillLevel: [
        "What's your skill level or DUPR rating?",
        "Do you know what division you typically play in (3.0, 3.5, 4.0, etc.)?",
        "Are you a recreational player or do you compete at a specific level?",
      ],
      datePreference: [
        "When are you looking to play - this weekend, next week, or flexible?",
        "Do you have specific dates in mind?",
        "Are you looking for events coming up soon or planning ahead?",
      ],
      travelDistance: [
        "How far are you willing to travel?",
        "Are you looking for local events or willing to travel for tournaments?",
        "What's your preferred travel distance - within 25 miles, 50 miles, or further?",
      ],
      tournamentPreference: [
        "Do you prefer recreational tournaments or more competitive events?",
        "Are you interested in sanctioned tournaments or any type of organized play?",
        "What level of competition appeals to you?",
      ],
    },
  },

  skillDevelopment: {
    name: "Skill Development",
    keywords: [
      "improve",
      "learn",
      "practice",
      "technique",
      "better at",
      "how to",
      "training",
    ],
    requiredInfo: ["experience", "specificSkill"],
    optionalInfo: ["goals", "practiceTime", "weaknesses"],
    followUpQuestions: {
      specificSkill: [
        "What specific aspect of your game would you like to improve?",
        "Are you looking to work on serves, volleys, dinks, or something else?",
        "What part of your game feels like it needs the most work?",
      ],
      goals: [
        "What are your pickleball goals?",
        "Are you preparing for tournaments or just want to have more fun?",
        "What would success look like for you in pickleball?",
      ],
      practiceTime: [
        "How much time can you dedicate to practice?",
        "Do you prefer on-court practice or off-court drills?",
        "Are you looking for quick tips or a structured practice plan?",
      ],
      experience: [
        "How would you describe your pickleball experience level?",
        "Are you completely new to pickleball or have you played before?",
        "Would you consider yourself a beginner, intermediate, or advanced player?",
      ],
    },
  },

  strategyAdvice: {
    name: "Strategy Advice",
    keywords: [
      "strategy",
      "tactics",
      "positioning",
      "when to",
      "should I",
      "game plan",
    ],
    requiredInfo: ["experience", "situation"],
    optionalInfo: ["opponents", "playstyle", "weaknesses"],
    followUpQuestions: {
      situation: [
        "What specific game situation are you asking about?",
        "Is this for singles or doubles play?",
        "Are you looking for offensive or defensive strategy?",
      ],
      opponents: [
        "What type of opponents are you typically facing?",
        "Are they more aggressive or defensive players?",
        "Do they have any particular strengths or weaknesses?",
      ],
      experience: [
        "How would you describe your pickleball experience level?",
        "Are you completely new to pickleball or have you played before?",
        "Would you consider yourself a beginner, intermediate, or advanced player?",
      ],
    },
  },

  equipmentGeneral: {
    name: "Equipment General",
    keywords: ["shoes", "bag", "clothes", "gear", "equipment", "what to wear"],
    requiredInfo: ["equipmentType", "budget"],
    optionalInfo: ["playFrequency", "preferences"],
    followUpQuestions: {
      equipmentType: [
        "What specific equipment are you looking for?",
        "Are you shopping for shoes, bags, clothing, or accessories?",
        "What piece of gear do you need help with?",
      ],
      budget: [
        "What's your budget range for this equipment?",
        "Are you looking for budget-friendly or premium options?",
        "Do you have a specific price range in mind?",
      ],
    },
  },

  rulesAndRegulations: {
    name: "Rules and Regulations",
    keywords: [
      "rule",
      "legal",
      "fault",
      "violation",
      "allowed",
      "can I",
      "is it legal",
    ],
    requiredInfo: ["ruleQuestion"],
    optionalInfo: ["gameContext"],
    followUpQuestions: {
      ruleQuestion: [
        "What specific rule are you wondering about?",
        "Can you describe the situation you're asking about?",
        "What happened that made you question the rule?",
      ],
      gameContext: [
        "Was this in a tournament or casual game?",
        "Were you playing singles or doubles?",
        "Can you give me more context about what happened?",
      ],
    },
  },
}

// Analyze user message to determine category and missing information
export function analyzeUserMessage(
  message: string,
  context: UserContext = {}
): {
  category: string | null
  missingInfo: string[]
  confidence: number
} {
  const lowerMessage = message.toLowerCase()

  // Find matching category
  let bestMatch: { category: string; score: number } | null = null

  for (const [categoryKey, category] of Object.entries(
    conversationCategories
  )) {
    const score = category.keywords.reduce((acc, keyword) => {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return acc + keyword.length // Longer matches score higher
      }
      return acc
    }, 0)

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { category: categoryKey, score }
    }
  }

  if (!bestMatch) {
    return { category: null, missingInfo: [], confidence: 0 }
  }

  const category = conversationCategories[bestMatch.category]
  const missingInfo: string[] = []

  // Check what information is missing
  for (const info of category.requiredInfo) {
    if (!hasContextInfo(context, info, lowerMessage)) {
      missingInfo.push(info)
    }
  }

  // Add some optional info if we don't have enough context
  if (missingInfo.length === 0) {
    for (const info of category.optionalInfo.slice(0, 2)) {
      // Limit to 2 optional questions
      if (!hasContextInfo(context, info, lowerMessage)) {
        missingInfo.push(info)
      }
    }
  }

  const confidence = Math.min(bestMatch.score / 10, 1) // Normalize to 0-1

  return { category: bestMatch.category, missingInfo, confidence }
}

// Check if we have specific information in context or message
function hasContextInfo(
  context: UserContext,
  infoType: string,
  message: string
): boolean {
  switch (infoType) {
    case "experience":
      if (context.experience && context.experience !== "unknown") return true
      return /\b(beginner|new|first time|never played|intermediate|advanced|expert|experienced)\b/i.test(
        message
      )

    case "budget":
      if (context.budget) return true
      return /\$|\b(budget|price|cost|cheap|expensive|under|around)\b/i.test(
        message
      )

    case "playFrequency":
      if (context.playFrequency) return true
      return /\b(daily|weekly|casual|competitive|tournament|often|rarely)\b/i.test(
        message
      )

    case "playStyle":
      if (context.playStyle && context.playStyle !== "unknown") return true
      return /\b(power|control|spin|aggressive|defensive|balanced)\b/i.test(
        message
      )

    case "specificSkill":
      return /\b(serve|volley|dink|backhand|forehand|footwork|positioning|smash|consistency|third shot|warm up|teamwork|mental|focus|mistakes|beginners|alone|opponent|anticipate)\b/i.test(
        message
      )

    case "equipmentType":
      return /\b(paddle|shoes|bag|shorts|shirt|hat|sunglasses|gear|racket|grip|materials|balls|outdoor)\b/i.test(
        message
      )

    case "ruleQuestion":
      return /\b(fault|violation|legal|allowed|rule|kitchen|non-volley|pickle-over|score|serving|line|double-bounce|paddle size|specifications|tiebreaker|singles|doubles|let|court dimensions|timeout|substitution)\b/i.test(
        message
      )

    case "generalQuestion":
      return /\b(injury|prevent|tournament|rating|history|coaching|courts|clubs|beginner|fitness|partner|group|recreational|competitive|weather|popularity|future|ai|analyze)\b/i.test(
        message
      )

    case "paddlesToCompare":
      return (
        /\b(vs|versus|compare|difference between)\s+\w+/i.test(message) ||
        message.split(/\s+/).filter((word) => /paddle|racket/i.test(word))
          .length >= 2
      )

    case "comparisonCriteria":
      return /\b(weight|power|control|price|durability|spin|feel|grip|specs)\b/i.test(
        message
      )

    case "duprQuestion":
      return /\b(dupr|rating|score|ranking)\b/i.test(message)

    case "duprIntent":
      if (context.duprIntent) return true
      // Check for player lookup indicators
      if (
        /\b(what is|find|look up|check)\s+\w+['']?s?\s*(dupr|rating)/i.test(
          message
        ) ||
        /\b\w+['']?s?\s*(dupr|rating)\b/i.test(message) ||
        /\bdupr\s+(of|for)\s+\w+/i.test(message)
      ) {
        return true // Intent is lookup
      }
      // Check for personal indicators
      if (/\b(my|get|how do I|improve my)\s*(dupr|rating)/i.test(message)) {
        return true // Intent is personal
      }
      return /\b(dupr|rating|score)\b/i.test(message)

    case "playerName":
      if (context.playerName) return true
      return (
        /\b(what is|find|look up|check)\s+(\w+(?:\s+\w+)??)['']?s?\s*(dupr|rating)/i.test(
          message
        ) || /\b(\w+(?:\s+\w+)??)['']?s?\s*(dupr|rating)\b/i.test(message)
      )

    case "duprScore":
      if (context.duprScore) return true
      return /\b(\d+\.\d+|\d+)\s*(dupr|rating)\b/i.test(message)

    case "duprGoals":
      return /\b(improve|tournament|track|understand|get rated)\b/i.test(
        message
      )

    case "location":
      if (
        context.location?.city ||
        context.location?.state ||
        context.location?.zipCode
      )
        return true
      return /\b(\w+,\s*\w{2}|\d{5}|in\s+\w+|near\s+\w+|around\s+\w+)\b/i.test(
        message
      )

    case "eventType":
      return /\b(tournament|game|match|league|pickup|recreational|competitive)\b/i.test(
        message
      )

    case "travelDistance":
      if (context.travelDistance) return true
      return /\b(local|nearby|within\s+\d+|miles|travel|drive)\b/i.test(message)

    case "datePreference":
      if (context.datePreference) return true
      return /\b(this weekend|next week|soon|today|tomorrow|this month|next month)\b/i.test(
        message
      )

    case "goals":
      return /\b(goal|improve|win|tournament|fun|competitive|recreational)\b/i.test(
        message
      )

    case "practiceTime":
      return /\b(practice|drill|time|schedule|routine)\b/i.test(message)

    case "gameContext":
      return /\b(tournament|casual|singles|doubles|competitive|recreational)\b/i.test(
        message
      )

    default:
      return false
  }
}

// Generate follow-up questions
export function generateFollowUpQuestions(
  category: string,
  missingInfo: string[],
  context: UserContext = {}
): string[] {
  if (!conversationCategories[category]) return []

  const categoryData = conversationCategories[category]
  const questions: string[] = []

  for (const info of missingInfo.slice(0, 2)) {
    // Limit to 2 questions at a time
    const questionOptions = categoryData.followUpQuestions[info]
    if (questionOptions && questionOptions.length > 0) {
      // Pick a random question from the options
      const randomQuestion =
        questionOptions[Math.floor(Math.random() * questionOptions.length)]
      questions.push(randomQuestion)
    }
  }

  return questions
}

// Extract context from user message
export function extractContextFromMessage(
  message: string
): Partial<UserContext> {
  const context: Partial<UserContext> = {}
  const lowerMessage = message.toLowerCase()

  // Extract experience level
  if (
    /\b(beginner|new|first time|never played|just started)\b/i.test(message)
  ) {
    context.experience = "beginner"
  } else if (
    /\b(intermediate|some experience|played before)\b/i.test(message)
  ) {
    context.experience = "intermediate"
  } else if (
    /\b(advanced|expert|experienced|competitive|tournament)\b/i.test(message)
  ) {
    context.experience = "advanced"
  }

  // Extract budget information
  const budgetMatch = message.match(/\$(\d+)(?:-\$?(\d+))?/)
  if (budgetMatch) {
    if (budgetMatch[2]) {
      context.budget = `$${budgetMatch[1]}-$${budgetMatch[2]}`
    } else {
      context.budget = `under $${budgetMatch[1]}`
    }
  } else if (/\b(cheap|budget|affordable)\b/i.test(message)) {
    context.budget = "budget-friendly"
  } else if (/\b(expensive|premium|high-end)\b/i.test(message)) {
    context.budget = "premium"
  }

  // Extract play frequency
  if (/\b(daily|every day)\b/i.test(message)) {
    context.playFrequency = "daily"
  } else if (/\b(weekly|week|regularly)\b/i.test(message)) {
    context.playFrequency = "weekly"
  } else if (/\b(casual|occasionally|sometimes)\b/i.test(message)) {
    context.playFrequency = "casual"
  } else if (/\b(competitive|tournament|serious)\b/i.test(message)) {
    context.playFrequency = "competitive"
  }

  // Extract play style
  if (/\b(power|hard|aggressive|attack)\b/i.test(message)) {
    context.playStyle = "power"
  } else if (/\b(control|placement|precise|accurate)\b/i.test(message)) {
    context.playStyle = "control"
  } else if (/\b(spin|topspin|slice)\b/i.test(message)) {
    context.playStyle = "spin"
  } else if (/\b(balanced|all-around|versatile)\b/i.test(message)) {
    context.playStyle = "balanced"
  }

  // Extract DUPR score
  const duprMatch = message.match(/(\d+\.\d+|\d+)\s*(dupr|rating)/i)
  if (duprMatch) {
    context.duprScore = parseFloat(duprMatch[1])
  }

  // Extract DUPR intent and player name
  const playerLookupMatch =
    message.match(
      /\b(what is|find|look up|check)\s+(\w+(?:\s+\w+)??)['']?s?\s*(dupr|rating)/i
    ) ||
    message.match(/\b(\w+(?:\s+\w+)??)['']?s?\s*(dupr|rating)\b/i) ||
    message.match(/\bdupr\s+(of|for)\s+(\w+(?:\s+\w+)?)/i)

  if (playerLookupMatch) {
    context.duprIntent = "lookup"
    // Extract player name from the match
    const nameMatch =
      playerLookupMatch[2] || playerLookupMatch[1] || playerLookupMatch[3]
    if (
      nameMatch &&
      !["my", "i", "me", "dupr", "rating", "score"].includes(
        nameMatch.toLowerCase()
      )
    ) {
      context.playerName = nameMatch.trim()
    }
  } else if (/\b(my|get|how do I|improve my)\s*(dupr|rating)/i.test(message)) {
    context.duprIntent = "personal"
  } else if (/\b(what is|how does|explain)\s*(dupr|rating)/i.test(message)) {
    context.duprIntent = "general"
  }

  // Extract location information
  const locationMatch =
    message.match(/(?:in|near|around)\s+([^,]+)(?:,\s*([A-Z]{2}))?/i) ||
    message.match(/([A-Za-z\s]+),\s*([A-Z]{2})/i) ||
    message.match(/(\d{5})/)

  if (locationMatch) {
    context.location = {}
    if (locationMatch[0].match(/\d{5}/)) {
      context.location.zipCode = locationMatch[1]
    } else {
      context.location.city = locationMatch[1]?.trim()
      context.location.state = locationMatch[2]?.trim()
    }
  }

  // Extract travel distance preference
  if (/\b(local|nearby|close)\b/i.test(message)) {
    context.travelDistance = "local"
  } else if (/within\s+25\s*miles?/i.test(message)) {
    context.travelDistance = "25_miles"
  } else if (/within\s+50\s*miles?/i.test(message)) {
    context.travelDistance = "50_miles"
  } else if (/within\s+100\s*miles?/i.test(message)) {
    context.travelDistance = "100_miles"
  } else if (
    /\b(anywhere|willing to travel|don't mind traveling)\b/i.test(message)
  ) {
    context.travelDistance = "anywhere"
  }

  // Extract date preferences
  if (/\b(this weekend|weekend)\b/i.test(message)) {
    context.datePreference = "this_weekend"
  } else if (/\b(next week)\b/i.test(message)) {
    context.datePreference = "next_week"
  } else if (/\b(this month)\b/i.test(message)) {
    context.datePreference = "this_month"
  } else if (/\b(next month)\b/i.test(message)) {
    context.datePreference = "next_month"
  } else if (/\b(flexible|anytime|open)\b/i.test(message)) {
    context.datePreference = "flexible"
  }

  // Extract skill level for tournaments
  const skillMatch = message.match(/(\d\.\d|\d\.\d+)\s*(level|division)?/i)
  if (skillMatch) {
    context.skillLevel = skillMatch[1] as any
  } else if (/\b(recreational|rec|casual)\b/i.test(message)) {
    context.skillLevel = "recreational"
  } else if (/\b(5\.0|expert|advanced)\b/i.test(message)) {
    context.skillLevel = "5.0+"
  }

  // Extract tournament preference
  if (/\b(recreational|fun|casual)\b/i.test(message)) {
    context.tournamentPreference = "recreational"
  } else if (/\b(competitive|serious|sanctioned)\b/i.test(message)) {
    context.tournamentPreference = "competitive"
  }

  return context
}

// Generate intelligent system prompt based on analysis
export function generateIntelligentSystemPrompt(
  category: string | null,
  missingInfo: string[],
  context: UserContext,
  followUpQuestions: string[]
): string {
  const basePrompt = `You are PickleAI, a concise and knowledgeable pickleball assistant. Keep responses under 150 words unless explaining complex rules.`

  if (!category || missingInfo.length === 0) {
    return `${basePrompt}

Provide focused, actionable advice based on the user's question. Be direct and practical.`
  }

  const categoryData = conversationCategories[category]

  return `${basePrompt}

TOPIC: ${categoryData.name}

NEED MORE INFO: Ask these questions naturally:
${followUpQuestions.map((q) => `• ${q}`).join("\n")}

KNOWN CONTEXT:
${
  Object.entries(context)
    .filter(([_, value]) => value && value !== "unknown")
    .map(
      ([key, value]) =>
        `• ${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`
    )
    .join("\n") || "• None yet"
}

RESPONSE STYLE:
• Acknowledge their question briefly
• Ask 1-2 follow-up questions naturally
• Be encouraging and ready to help
• Keep it conversational but concise

${getCategorySpecificGuidance(category, context)}`
}

// Helper function for category-specific guidance
function getCategorySpecificGuidance(
  category: string,
  context: UserContext
): string {
  switch (category) {
    case "skills":
      return "For skills questions, focus on practical drills and techniques they can implement immediately."
    case "rules":
      return "For rules questions, provide clear, accurate explanations with examples when helpful."
    case "equipment":
      return "For equipment questions, consider their budget and experience level in recommendations."
    case "general":
      return "For general questions, provide helpful resources and practical next steps."
    default:
      return ""
  }
}
