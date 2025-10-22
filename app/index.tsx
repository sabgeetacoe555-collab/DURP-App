import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import VideoSplash from "@/components/VideoSplash"

export default function Index() {
  const { isLoading, isStartupComplete } = useAuth()

  // Show video splash while authentication state is being determined
  return <VideoSplash />
}
