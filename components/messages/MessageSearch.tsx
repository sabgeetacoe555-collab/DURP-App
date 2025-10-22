import React, { useState } from "react"
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "../useColorScheme"

interface MessageSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchType: "all" | "posts" | "replies"
  onSearchTypeChange: (type: "all" | "posts" | "replies") => void
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
  searchQuery,
  onSearchChange,
  searchType,
  onSearchTypeChange,
}) => {
  const colors = useColorScheme()

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Input */}
      <View
        style={[styles.searchContainer, { borderBottomColor: colors.border }]}
      >
        <View
          style={[styles.searchInputWrapper, { borderColor: colors.border }]}
        >
          <Ionicons name="search" size={20} color={colors.text + "60"} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search messages..."
            placeholderTextColor={colors.text + "60"}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => onSearchChange("")}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.text + "60"}
              />
            </Pressable>
          )}
        </View>

        {/* Search Type Tabs */}
        {/* <View style={styles.searchTypeContainer}>
          {(["all", "posts", "replies"] as const).map((type) => (
            <Pressable
              key={type}
              style={[
                styles.searchTypeButton,
                {
                  backgroundColor:
                    searchType === type ? colors.tint : colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => onSearchTypeChange(type)}
            >
              <Text
                style={[
                  styles.searchTypeButtonText,
                  {
                    color: searchType === type ? "white" : colors.text,
                  },
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View> */}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchTypeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  searchTypeButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
})
