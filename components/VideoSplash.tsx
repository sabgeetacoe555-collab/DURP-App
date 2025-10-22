import React, { useRef, useEffect, useState } from "react"
import { View, StyleSheet, Dimensions } from "react-native"
import { VideoView, useVideoPlayer } from "expo-video"
import { useAuth } from "@/contexts/AuthContext"
import { router, usePathname } from "expo-router"

const { width, height } = Dimensions.get("window")

export default function VideoSplash() {
  const { user, isLoading, isStartupComplete } = useAuth()
  const [videoFinished, setVideoFinished] = useState(false)
  const [videoStarted, setVideoStarted] = useState(false)
  const [shouldNavigate, setShouldNavigate] = useState(false)
  const player = useVideoPlayer(
    require("@/assets/NG app Into.mp4"),
    (player) => {
      player.loop = false
      player.muted = true
    }
  )

  useEffect(() => {
    console.log("🎬 VideoSplash: Setting up video player")

    // Try multiple event listeners
    const statusSubscription = player.addListener(
      "playbackStatusUpdate",
      (status) => {
        console.log("🎬 Video status update:", {
          isLoaded: status.isLoaded,
          isPlaying: status.isPlaying,
          didJustFinish: status.didJustFinish,
          durationMillis: status.durationMillis,
          positionMillis: status.positionMillis,
          status: status.status,
        })

        if (status.isLoaded && status.didJustFinish) {
          console.log("🎬 Video finished playing naturally")
          setVideoFinished(true)
        }

        // Fallback: check if we're at the end of the video
        if (status.isLoaded && status.durationMillis && status.positionMillis) {
          const isAtEnd = status.positionMillis >= status.durationMillis - 100 // 100ms tolerance
          if (isAtEnd && !videoFinished) {
            console.log("🎬 Video reached end (fallback detection)")
            setVideoFinished(true)
          }
        }

        if (status.isLoaded && status.isPlaying && !videoStarted) {
          console.log("🎬 Video started playing")
          setVideoStarted(true)
        }
      }
    )

    // Try the 'statusChange' event as well
    const changeSubscription = player.addListener("statusChange", (status) => {
      console.log("🎬 Video status change:", status)
      if (status === "idle" && videoStarted) {
        console.log("🎬 Video status changed to idle - video finished")
        setVideoFinished(true)
      }
    })

    // Auto-play the video
    console.log("🎬 Attempting to play video")
    player.play()

    return () => {
      statusSubscription?.remove()
      changeSubscription?.remove()
    }
  }, [player, videoStarted, videoFinished])

  useEffect(() => {
    console.log("🎬 VideoSplash state:", {
      videoFinished,
      isLoading,
      isStartupComplete,
      shouldNavigate,
    })

    // Set shouldNavigate when app is ready, but don't navigate yet
    if (!isLoading && isStartupComplete && !shouldNavigate) {
      console.log("🎬 App is ready, waiting for video to finish")
      setShouldNavigate(true)
    }

    // Only navigate away when both the video is finished AND we should navigate
    if (videoFinished && shouldNavigate) {
      console.log("🎬 Navigating based on auth status")
      if (user) {
        // User is authenticated, go to main app
        router.replace("/(tabs)/widgets")
      } else {
        // User is not authenticated, go to login
        router.replace("/auth/login")
      }
    }
  }, [videoFinished, isLoading, isStartupComplete, shouldNavigate])

  // Last resort fallback: if video doesn't finish after 6 seconds, proceed anyway
  useEffect(() => {
    if (shouldNavigate && !videoFinished) {
      const fallbackTimer = setTimeout(() => {
        console.log(
          "🎬 Fallback: Video didn't finish in 6 seconds, proceeding anyway"
        )
        setVideoFinished(true)
      }, 6000)

      return () => clearTimeout(fallbackTimer)
    }
  }, [shouldNavigate, videoFinished])

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit="cover"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: width,
    height: width * (9 / 16), // 16:9 aspect ratio, fits horizontally
  },
})
