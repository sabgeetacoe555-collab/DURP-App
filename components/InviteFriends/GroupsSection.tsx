import React from "react"
import { View, Text, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "../../components/useColorScheme"

type Group = any

interface GroupsSectionProps {
  groups: Group[]
  groupsLoading: boolean
  expanded: boolean
  onToggleSection: () => void
  selectedGroups: string[]
  onToggleGroupSelection: (groupId: string) => void
  searchQuery: string
}

export default function GroupsSection({
  groups,
  groupsLoading,
  expanded,
  onToggleSection,
  selectedGroups,
  onToggleGroupSelection,
  searchQuery,
}: GroupsSectionProps) {
  const colors = useColorScheme()

  const filteredGroups = groups.filter((group) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase().trim()
    const name = group.name.toLowerCase()
    return name.includes(query)
  })

  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={onToggleSection}>
        <View style={styles.sectionHeaderContent}>
          <Ionicons name="people" size={20} color={colors.tint} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Groups ({filteredGroups.length})
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.text}
        />
      </Pressable>

      {expanded && (
        <View style={styles.sectionContent}>
          {groupsLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading groups...
              </Text>
            </View>
          ) : filteredGroups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {searchQuery.trim()
                  ? `No groups found matching "${searchQuery}"`
                  : "No groups found. Create a group to invite multiple people at once."}
              </Text>
            </View>
          ) : (
            filteredGroups.map((group) => (
              <View
                key={group.id}
                style={[
                  styles.groupItem,
                  {
                    borderColor: selectedGroups.includes(group.id)
                      ? colors.tint
                      : "#ddd",
                  },
                ]}
              >
                <View style={styles.groupInfo}>
                  <Text style={[styles.groupName, { color: colors.text }]}>
                    {group.name}
                  </Text>
                  <Text
                    style={[styles.groupMembers, { color: colors.text + "80" }]}
                  >
                    {(typeof group.creator === "string"
                      ? group.creator
                      : group.creator?.name
                    )?.split(" ")[0] || "Admin"}{" "}
                    and {group.member_count} others
                  </Text>
                </View>

                <Pressable
                  onPress={() => onToggleGroupSelection(group.id)}
                  style={styles.selectionButton}
                >
                  <Ionicons
                    name={
                      selectedGroups.includes(group.id)
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={24}
                    color={
                      selectedGroups.includes(group.id)
                        ? colors.tint
                        : colors.text + "60"
                    }
                  />
                </Pressable>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  )
}

const styles = {
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeaderContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginLeft: 8,
  },
  sectionContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center" as const,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.6,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center" as const,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center" as const,
    opacity: 0.6,
  },
  groupItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  groupMembers: {
    fontSize: 14,
  },
  selectionButton: {
    padding: 4,
  },
}
