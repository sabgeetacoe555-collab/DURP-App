import React from "react"
import { View, Text, StyleSheet } from "react-native"
import DUPRRatingPill from "@/components/DUPRRatingPill"
import { Session } from "@/types"

interface ConfirmedParticipantsSectionProps {
  sessionData: Session
  participantData: { [key: string]: any }
}

export function ConfirmedParticipantsSection({
  sessionData,
  participantData,
}: ConfirmedParticipantsSectionProps) {
  return (
    <View style={styles.confirmedParticipantsContainer}>
      <Text style={styles.confirmedParticipantsTitle}>
        Confirmed Participants (
        {1 + (sessionData.accepted_participants?.length || 0)})
      </Text>
      <View style={styles.participantsList}>
        {/* Always show the session creator (host) first */}
        <View key={sessionData.user_id} style={styles.participantItem}>
          <View style={styles.participantAvatar}>
            <Text style={styles.participantInitial}>
              {participantData[sessionData.user_id]?.name
                ?.charAt(0)
                ?.toUpperCase() || "H"}
            </Text>
          </View>
          <View style={styles.participantInfo}>
            <Text style={styles.participantName}>
              {participantData[sessionData.user_id]?.name || "Host"}
            </Text>
            {(participantData[sessionData.user_id]?.dupr_rating_singles ||
              participantData[sessionData.user_id]?.dupr_rating_doubles) && (
              <DUPRRatingPill
                singlesRating={
                  participantData[sessionData.user_id].dupr_rating_singles
                }
                doublesRating={
                  participantData[sessionData.user_id].dupr_rating_doubles
                }
                size="small"
              />
            )}
          </View>
        </View>

        {/* Show accepted participants */}
        {sessionData.accepted_participants?.map(
          (participantId: string, index: number) => {
            const userData = participantData[participantId]
            return (
              <View key={participantId} style={styles.participantItem}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.participantInitial}>
                    {userData?.name?.charAt(0)?.toUpperCase() || "P"}
                  </Text>
                </View>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>
                    {userData?.name || `Player ${index + 1}`}
                  </Text>
                  {(userData?.dupr_rating_singles ||
                    userData?.dupr_rating_doubles) && (
                    <DUPRRatingPill
                      singlesRating={userData.dupr_rating_singles}
                      doublesRating={userData.dupr_rating_doubles}
                      size="small"
                    />
                  )}
                </View>
              </View>
            )
          }
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  confirmedParticipantsContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 100, // Add extra bottom margin for scrollable content
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  confirmedParticipantsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  participantsList: {
    flexDirection: "column",
    gap: 12,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    width: "100%",
  },
  participantInfo: {
    flex: 1,
    alignItems: "flex-start",
  },
  participantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  participantInitial: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  participantName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
})
