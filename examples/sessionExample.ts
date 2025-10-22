// examples/sessionExample.ts
// This file demonstrates how to use the session service to save pre-play sessions

import { sessionService } from "../services/sessionService"
import { createSessionData } from "../types"

// Example of how to save a pre-play session
export const savePrePlaySessionExample = async () => {
  try {
    // Example data for a pre-play session
    const sessionData = createSessionData(
      new Date(), // date
      new Date(), // time
      "Local Pickleball Court", // location
      "open play", // session type
      ["serve", "dinking"], // focus areas
      "good", // mood rating
      "great" // body readiness
    )

    // Save to database
    const savedSession = await sessionService.createSession(sessionData)
    console.log("Session saved successfully:", savedSession)

    return savedSession
  } catch (error) {
    console.error("Error saving session:", error)
    throw error
  }
}

// Example of how to get all sessions for the current user
export const getSessionsExample = async () => {
  try {
    const sessions = await sessionService.getSessions()
    console.log("Retrieved sessions:", sessions)
    return sessions
  } catch (error) {
    console.error("Error retrieving sessions:", error)
    throw error
  }
}

// Example of how to update a session
export const updateSessionExample = async (sessionId: string) => {
  try {
    const updatedSession = await sessionService.updateSession(sessionId, {
      completed: true,
      goal_achievement: "Improved serve accuracy",
    })
    console.log("Session updated successfully:", updatedSession)
    return updatedSession
  } catch (error) {
    console.error("Error updating session:", error)
    throw error
  }
}
