import React from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"

export interface TabItem {
  key: string
  label: string
  icon?: string
}

interface ScreenTabsProps {
  tabs: TabItem[]
  activeTab: string
  onTabPress: (tabKey: string) => void
  colors: {
    text: string
    tint: string
    background: string
  }
  style?: any
}

export const ScreenTabs: React.FC<ScreenTabsProps> = ({
  tabs,
  activeTab,
  onTabPress,
  colors,
  style,
}) => {
  return (
    <View
      style={[styles.tabBar, { backgroundColor: colors.background }, style]}
    >
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          style={[
            styles.tabButton,
            activeTab === tab.key && styles.tabButtonActive,
            {
              borderBottomColor:
                activeTab === tab.key ? colors.tint : "transparent",
            },
          ]}
          onPress={() => onTabPress(tab.key)}
        >
          <Text
            style={[
              styles.tabButtonText,
              {
                color: activeTab === tab.key ? colors.tint : colors.text,
                opacity: activeTab === tab.key ? 1 : 0.6,
              },
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaed",
    paddingHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    // borderBottomColor is set dynamically
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
})
