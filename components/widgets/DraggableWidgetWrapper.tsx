// components/widgets/DraggableWidgetWrapper.tsx
import React from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { ScaleDecorator } from "react-native-draggable-flatlist"
import { WidgetItem } from "../../types/widgets"
import { useColorScheme } from "../useColorScheme"

interface DraggableWidgetWrapperProps {
  widget: WidgetItem
  children: React.ReactNode
  drag: () => void
  isActive: boolean
}

export default function DraggableWidgetWrapper({
  widget,
  children,
  drag,
  isActive,
}: DraggableWidgetWrapperProps) {
  const colors = useColorScheme()

  return (
    <ScaleDecorator>
      <TouchableOpacity
        // style={[styles.container, { backgroundColor: colors.background }]}
        onLongPress={drag}
        disabled={isActive}
        activeOpacity={0.8}
      >
        {/* Widget Content */}
        <View style={[styles.widgetContent, isActive && styles.activeWidget]}>
          {children}
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  widgetContent: {
    // padding: 16,
  },
  activeWidget: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
})
