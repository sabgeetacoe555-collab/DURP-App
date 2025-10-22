// services/OpenAIService.ts
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      role: string
      content: string
    }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface OpenAIConfig {
  model?: string
  maxTokens?: number
  temperature?: number
}

const BASE_URL = "https://api.openai.com/v1"

export const sendMessage = async (
  messages: ChatMessage[],
  systemPrompt?: string,
  config: OpenAIConfig = {}
): Promise<string> => {
  try {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY

    // Format messages for OpenAI API
    const openAIMessages = [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || "gpt-3.5-turbo",
        messages: openAIMessages,
        max_tokens: config.maxTokens || 500,
        temperature: config.temperature || 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || "Unknown error"}`
      )
    }

    const data: OpenAIResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from OpenAI")
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error("OpenAI Service Error:", error)
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to get response from AI assistant"
    )
  }
}

export const getPickleballSystemPrompt = (): string => {
  return `You are PickleAI, a concise and knowledgeable pickleball assistant. 

RESPONSE STYLE:
- Be direct and actionable
- Keep responses under 150 words unless explaining complex rules
- Use bullet points for multiple tips
- Be encouraging and supportive
- Focus on practical, implementable advice

EXPERTISE AREAS:
- Skills & Techniques: Serve, dinking, volleys, footwork, strategy
- Rules & Regulations: Official rules, common violations, tournament rules
- Equipment: Paddles, shoes, gear recommendations
- General: Tournaments, courts, community, fitness benefits

When users ask about specific skills, rules, equipment, or general topics, provide focused, practical advice they can immediately apply.`
}

// Alternative prompts for different contexts
export const getSystemPrompts = {
  pickleball: getPickleballSystemPrompt,
  beginner: (): string =>
    `${getPickleballSystemPrompt()}\n\nFocus especially on beginner-friendly explanations and basic concepts.`,
  advanced: (): string =>
    `${getPickleballSystemPrompt()}\n\nProvide detailed, advanced strategy and technique information.`,
  equipment: (): string =>
    `${getPickleballSystemPrompt()}\n\nSpecialize in equipment recommendations, reviews, and technical specifications.`,
}
