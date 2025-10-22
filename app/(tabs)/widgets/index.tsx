import React from "react"
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Pressable,
} from "react-native"
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist"
import CustomHeader from "@/components/CustomHeader"
import NCPAWidget from "@/components/widgets/NCPAWidget"
import DUPRWidget from "@/components/widgets/DUPRWidget"
import PickleTvWidget from "@/components/widgets/PickleTvWidget"
import UpcomingSessionsWidget from "@/components/widgets/UpcomingSessionsWidget"
import StatsSummaryWidget from "@/components/widgets/StatsSummaryWidget"
import CollegeHubWidget from "@/components/widgets/CollegeHubWidget"
import DraggableWidgetWrapper from "@/components/widgets/DraggableWidgetWrapper"
import { useWidgetConfig } from "@/hooks/useWidgetConfig"
import { WidgetItem } from "@/types/widgets"
import { useColorScheme } from "@/components/useColorScheme"
import { Ionicons } from "@expo/vector-icons"

export default function WidgetsScreen() {
  const { widgets, loading, updateWidgetOrder, resetToDefault } =
    useWidgetConfig()
  const colors = useColorScheme()

  const renderWidget = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<WidgetItem>) => {
    let widgetComponent: React.ReactNode

    switch (item.type) {
      case "stats":
        widgetComponent = <StatsSummaryWidget />
        break
      case "sessions":
        widgetComponent = <UpcomingSessionsWidget />
        break
      case "dupr":
        widgetComponent = <DUPRWidget />
        break
      case "ncpa":
        widgetComponent = <NCPAWidget />
        break
      case "pickletv":
        widgetComponent = <PickleTvWidget />
        break
      case "collegehub":
        widgetComponent = <CollegeHubWidget />
        break
      default:
        return null
    }

    return (
      <DraggableWidgetWrapper widget={item} drag={drag} isActive={isActive}>
        {widgetComponent}
      </DraggableWidgetWrapper>
    )
  }

  const handleDragEnd = ({ data }: { data: WidgetItem[] }) => {
    updateWidgetOrder(data)
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Widgets" showBackButton={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading widgets...
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Widgets" showBackButton={false} />
      <View style={styles.headerActions}>
        <Text style={[styles.instructionText, { color: colors.text + "80" }]}>
          Long press and drag to reorder widgets
        </Text>
        {/* <Pressable onPress={resetToDefault} style={styles.resetButton}>
          <Ionicons name="refresh" size={20} color={colors.tint} />
          <Text style={[styles.resetText, { color: colors.tint }]}>
            Reset Order
          </Text>
        </Pressable> */}
      </View>
      <DraggableFlatList
        data={widgets}
        onDragEnd={handleDragEnd}
        keyExtractor={(item) => item.id}
        renderItem={renderWidget}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        activationDistance={10}
        dragItemOverflow={true}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 200, // Extra padding for tab bar and safe area
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  instructionText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  resetText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "500",
  },
})
