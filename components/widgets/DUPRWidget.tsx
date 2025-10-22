import React from "react"
import { StyleSheet, Pressable, View, Image } from "react-native"
import { Text } from "@/components/Themed"
import { useAuth } from "@/contexts/AuthContext"

export default function DUPRWidget() {
  const {
    user,
    duprId,
    singlesRating,
    doublesRating,
    isDuprConnected,
    isLoading,
  } = useAuth()

  const handleConnect = async () => {
    // TODO: Implement DUPR connection flow
    console.log("Connect to DUPR pressed")
  }

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Image
          source={require("@/assets/images/dupr-logo.png")}
          style={styles.logo}
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/dupr-logo.png")}
        style={styles.logo}
      />

      {isDuprConnected ? (
        <View style={styles.connectedContent}>
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Singles Rating</Text>
            <Text style={styles.ratingValue}>
              {singlesRating ? singlesRating.toFixed(2) : "N/A"}
            </Text>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Doubles Rating</Text>
            <Text style={styles.ratingValue}>
              {doublesRating ? doublesRating.toFixed(2) : "N/A"}
            </Text>
          </View>

          <View style={styles.idSection}>
            <Text style={styles.idLabel}>DUPR ID</Text>
            <Text style={styles.idValue}>{duprId || "N/A"}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.disconnectedContent}>
          <Text style={styles.disconnectedText}>
            Connect your DUPR account to see your ratings
          </Text>
          <Pressable style={styles.connectButton} onPress={handleConnect}>
            <Text style={styles.connectButtonText}>Connect DUPR</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logo: {
    width: 80,
    height: 40,
    alignSelf: "center",
    marginBottom: 16,
    resizeMode: "contain",
  },
  connectedContent: {
    gap: 16,
  },
  ratingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#34495e",
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
  idSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  idLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#34495e",
  },
  idValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  disconnectedContent: {
    alignItems: "center",
    gap: 16,
  },
  disconnectedText: {
    fontSize: 16,
    textAlign: "center",
    color: "#7f8c8d",
    lineHeight: 22,
  },
  connectButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  connectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    color: "#7f8c8d",
    fontStyle: "italic",
  },
})
