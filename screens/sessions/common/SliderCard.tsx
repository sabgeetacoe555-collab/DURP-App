import React from "react"
import { StyleSheet, View } from "react-native"
import { Text } from "@/components/Themed"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import Card from "@/components/Card"
import Slider from "@react-native-community/slider"

interface SliderCardProps {
  title: string
  value: number
  onValueChange: (value: number) => void
  minValue?: number
  maxValue?: number
  step?: number
  showTicks?: boolean
}

export default function SliderCard({
  title,
  value,
  onValueChange,
  minValue = 1,
  maxValue = 5,
  step = 1,
  showTicks = true,
}: SliderCardProps) {
  const colors = useColorScheme()

  const renderTicks = () => {
    if (!showTicks) return null

    const ticks = []
    for (let i = minValue; i <= maxValue; i += step) {
      ticks.push(
        <View key={i} style={styles.tickContainer}>
          <View style={styles.tick} />
          <Text style={[styles.tickLabel, { color: colors.text }]}>{i}</Text>
        </View>
      )
    }
    return <View style={styles.ticksContainer}>{ticks}</View>
  }

  return (
    <Card title={title}>
      <View style={styles.sliderContainer}>
        <View style={styles.valueContainer}>
          <Text style={[styles.valueText, { color: colors.text }]}>
            {value}
          </Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={minValue}
          maximumValue={maxValue}
          step={step}
          value={value}
          onValueChange={onValueChange}
          minimumTrackTintColor="#000000"
          maximumTrackTintColor="#ffffff"
          thumbTintColor="#000000"
        />
        {renderTicks()}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  sliderContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  ticksContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginTop: 5,
  },
  tickContainer: {
    alignItems: "center",
  },
  tick: {
    width: 2,
    height: 8,
    backgroundColor: "#ccc",
    marginBottom: 4,
  },
  tickLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  valueContainer: {
    marginBottom: 10,
    alignItems: "center",
  },
  valueText: {
    fontSize: 24,
    fontWeight: "bold",
  },
})
