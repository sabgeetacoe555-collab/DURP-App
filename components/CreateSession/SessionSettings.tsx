import React from "react"
import { StyleSheet, View, Switch } from "react-native"
import { Text } from "@/components/Themed"
import { useColorScheme } from "@/components/useColorScheme"

interface SessionSettingsProps {
  allowGuests: boolean
  onAllowGuestsChange: (value: boolean) => void
  requireApproval: boolean
  onRequireApprovalChange: (value: boolean) => void
}

export default function SessionSettings({
  allowGuests,
  onAllowGuestsChange,
  requireApproval,
  onRequireApprovalChange,
}: SessionSettingsProps) {
  const colors = useColorScheme()

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Session Settings
      </Text>

      <View style={styles.settingRow}>
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Allow Guests
          </Text>
          <Text
            style={[styles.settingDescription, { color: colors.text + "80" }]}
          >
            Let non-members join this session
          </Text>
        </View>
        <Switch
          value={allowGuests}
          onValueChange={onAllowGuestsChange}
          trackColor={{ false: colors.text + "20", true: colors.tint + "40" }}
          thumbColor={allowGuests ? colors.tint : colors.text + "40"}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Require Approval
          </Text>
          <Text
            style={[styles.settingDescription, { color: colors.text + "80" }]}
          >
            Approve join requests before adding to session
          </Text>
        </View>
        <Switch
          value={requireApproval}
          onValueChange={onRequireApprovalChange}
          trackColor={{ false: colors.text + "20", true: colors.tint + "40" }}
          thumbColor={requireApproval ? colors.tint : colors.text + "40"}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
})
