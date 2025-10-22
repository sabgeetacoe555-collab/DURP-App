// hooks/useWidgetConfig.ts
import { useState, useEffect } from "react"
import { WidgetConfig, WidgetItem } from "../types/widgets"
import { widgetConfigService } from "../services/widgetConfigService"

export const useWidgetConfig = () => {
  const [widgets, setWidgets] = useState<WidgetItem[]>([])
  const [loading, setLoading] = useState(true)

  // Load widget configuration on mount
  useEffect(() => {
    loadWidgetConfig()
  }, [])

  const loadWidgetConfig = async () => {
    try {
      setLoading(true)
      const config = await widgetConfigService.getWidgetConfig()
      setWidgets(config)
    } catch (error) {
      console.error("Error loading widget config:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateWidgetOrder = async (newOrder: WidgetItem[]) => {
    try {
      setWidgets(newOrder)
      await widgetConfigService.updateWidgetOrder(newOrder)
    } catch (error) {
      console.error("Error updating widget order:", error)
      // Revert on error
      loadWidgetConfig()
    }
  }

  const toggleWidget = async (widgetId: string, enabled: boolean) => {
    try {
      const updatedWidgets = widgets.map((widget) =>
        widget.id === widgetId ? { ...widget, enabled } : widget
      )
      setWidgets(updatedWidgets)
      await widgetConfigService.toggleWidget(widgetId, enabled)
    } catch (error) {
      console.error("Error toggling widget:", error)
      // Revert on error
      loadWidgetConfig()
    }
  }

  const resetToDefault = async () => {
    try {
      await widgetConfigService.resetToDefault()
      await loadWidgetConfig()
    } catch (error) {
      console.error("Error resetting widget config:", error)
    }
  }

  return {
    widgets,
    loading,
    updateWidgetOrder,
    toggleWidget,
    resetToDefault,
    refresh: loadWidgetConfig,
  }
}
