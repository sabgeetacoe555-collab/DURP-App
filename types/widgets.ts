// types/widgets.ts
export interface WidgetConfig {
  id: string
  type: "stats" | "sessions" | "collegehub" | "dupr" | "ncpa" | "pickletv"
  title: string
  enabled: boolean
  order: number
}

export interface WidgetItem {
  id: string
  type: "stats" | "sessions" | "dupr" | "ncpa" | "pickletv" | "collegehub"
  title: string
  enabled: boolean
  order: number
}

export const DEFAULT_WIDGET_ORDER: WidgetConfig[] = [
  {
    id: "stats",
    type: "stats",
    title: "Stats Summary",
    enabled: true,
    order: 0,
  },
  {
    id: "sessions",
    type: "sessions",
    title: "Upcoming Sessions",
    enabled: true,
    order: 1,
  },

  { id: "dupr", type: "dupr", title: "DUPR", enabled: true, order: 3 },
  { id: "ncpa", type: "ncpa", title: "NCPA", enabled: true, order: 4 },
  {
    id: "pickletv",
    type: "pickletv",
    title: "PickleTv",
    enabled: true,
    order: 5,
  },
  {
    id: "collegehub",
    type: "collegehub",
    title: "College Hub",
    enabled: true,
    order: 6,
  },
]
