// services/startupService.ts
import { supabase } from "@/lib/supabase"

export interface StartupProgress {
  step: string
  progress: number
  total: number
  stepStartTime?: number
  stepDuration?: number
  totalDuration?: number
}

export type StartupProgressCallback = (progress: StartupProgress) => void

class StartupService {
  private isInitialized = false
  private progressCallback: StartupProgressCallback | null = null
  private overallStartTime: number = 0
  private currentStepStartTime: number = 0

  setProgressCallback(callback: StartupProgressCallback) {
    this.progressCallback = callback
  }

  private updateProgress(step: string, progress: number, total: number) {
    const now = Date.now()
    const stepDuration =
      this.currentStepStartTime > 0 ? now - this.currentStepStartTime : 0
    const totalDuration =
      this.overallStartTime > 0 ? now - this.overallStartTime : 0

    if (this.progressCallback) {
      this.progressCallback({
        step,
        progress,
        total,
        stepStartTime: this.currentStepStartTime,
        stepDuration,
        totalDuration,
      })
    }

    // Log timing information
    // console.log(
    //   `[Startup] ${step} - Duration: ${stepDuration}ms, Total: ${totalDuration}ms`
    // )

    // Start timing for next step
    this.currentStepStartTime = now
  }

  async initializeApp(userId: string): Promise<void> {
    if (this.isInitialized) {
      console.log("[Startup] App already initialized, skipping")
      return
    }

    try {
      // Start overall timing
      this.overallStartTime = Date.now()
      this.currentStepStartTime = this.overallStartTime

      // console.log(`[Startup] Starting app initialization for user: ${userId}`)

      this.updateProgress("Loading user data", 1, 4)

      // Step 1: Load user profile data
      const step1Start = Date.now()
      const { data: userProfile, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()
      const step1Duration = Date.now() - step1Start

      // Warn if step takes too long
      if (step1Duration > 5000) {
        console.warn(
          `[Startup] Step 1 (user profile) took ${step1Duration}ms - this is unusually slow`
        )
      }

      if (userError && userError.code !== "PGRST116") {
        console.error(
          `[Startup] Error loading user profile (${step1Duration}ms):`,
          userError
        )
      } else {
        // console.log(
        //   `[Startup] User profile loaded successfully (${step1Duration}ms)`
        // )
      }

      this.updateProgress("Preparing app data", 2, 4)

      // Step 2: Pre-warm any necessary caches or connections
      const step2Start = Date.now()
      await this.preWarmCaches(userId)
      const step2Duration = Date.now() - step2Start
      // console.log(`[Startup] Cache pre-warming completed (${step2Duration}ms)`)

      this.updateProgress("Initializing services", 3, 4)

      // Step 3: Initialize any required services
      const step3Start = Date.now()
      await this.initializeServices()
      const step3Duration = Date.now() - step3Start
      // console.log(`[Startup] Services initialized (${step3Duration}ms)`)

      this.updateProgress("App ready", 4, 4)

      // Step 4: Mark initialization as complete
      this.isInitialized = true
      const totalDuration = Date.now() - this.overallStartTime
      console
        .log
        // `[Startup] App initialization completed successfully in ${totalDuration}ms`
        ()

      // Add a small delay to ensure smooth transition
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (error) {
      const totalDuration = Date.now() - this.overallStartTime
      console.error(
        `[Startup] Error during app initialization (${totalDuration}ms):`,
        error
      )
      // Even if there's an error, mark as initialized to prevent infinite loading
      this.isInitialized = true
    }
  }

  private async preWarmCaches(userId: string): Promise<void> {
    // Pre-warm any caches or connections that might be needed
    // This is a placeholder for future optimizations
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  private async initializeServices(): Promise<void> {
    // Initialize any services that need to be ready before the app is fully loaded
    // This is a placeholder for future service initializations
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  reset(): void {
    this.isInitialized = false
    this.overallStartTime = 0
    this.currentStepStartTime = 0
    // console.log("[Startup] Service reset")
  }

  isAppInitialized(): boolean {
    return this.isInitialized
  }

  getTimingStats(): { totalDuration: number; isInitialized: boolean } {
    const totalDuration =
      this.overallStartTime > 0 ? Date.now() - this.overallStartTime : 0
    return {
      totalDuration,
      isInitialized: this.isInitialized,
    }
  }
}

export const startupService = new StartupService()
