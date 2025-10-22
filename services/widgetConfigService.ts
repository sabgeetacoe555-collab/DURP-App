// services/widgetConfigService.ts
import AsyncStorage from "@react-native-async-storage/async-storage"
import { WidgetConfig, DEFAULT_WIDGET_ORDER } from "../types/widgets"

const WIDGET_CONFIG_KEY = "widget_config"

export const widgetConfigService = {
  // Get widget configuration from storage
  async getWidgetConfig(): Promise<WidgetConfig[]> {
    try {
      const stored = await AsyncStorage.getItem(WIDGET_CONFIG_KEY)
      if (stored) {
        const config = JSON.parse(stored)
        // Ensure all default widgets are present
        const mergedConfig = DEFAULT_WIDGET_ORDER.map((defaultWidget) => {
          const storedWidget = config.find(
            (w: WidgetConfig) => w.id === defaultWidget.id
          )
          return storedWidget || defaultWidget
        })
        return mergedConfig.sort((a, b) => a.order - b.order)
      }
      return DEFAULT_WIDGET_ORDER
    } catch (error) {
      console.error("Error loading widget config:", error)
      return DEFAULT_WIDGET_ORDER
    }
  },

  // Save widget configuration to storage
  async saveWidgetConfig(config: WidgetConfig[]): Promise<void> {
    try {
      await AsyncStorage.setItem(WIDGET_CONFIG_KEY, JSON.stringify(config))
    } catch (error) {
      console.error("Error saving widget config:", error)
    }
  },

  // Update widget order
  async updateWidgetOrder(newOrder: WidgetConfig[]): Promise<void> {
    const updatedConfig = newOrder.map((widget, index) => ({
      ...widget,
      order: index,
    }))
    await this.saveWidgetConfig(updatedConfig)
  },

  // Toggle widget enabled state
  async toggleWidget(widgetId: string, enabled: boolean): Promise<void> {
    const config = await this.getWidgetConfig()
    const updatedConfig = config.map((widget) =>
      widget.id === widgetId ? { ...widget, enabled } : widget
    )
    await this.saveWidgetConfig(updatedConfig)
  },

  // Reset to default configuration
  async resetToDefault(): Promise<void> {
    await this.saveWidgetConfig(DEFAULT_WIDGET_ORDER)
  },
}
