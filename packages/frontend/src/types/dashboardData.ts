// Base entry types for time series data
export interface BaseEntry {
  date: string
  value: number
  "percentage-change"?: number | null
}

export interface BaseSummary {
  metric: string
  current: number
  previous: number
  "percentage-change": number | null
}

// Marketing Dashboard Types
export interface LeadsEntry extends BaseEntry {}
export interface LeadsSummary extends BaseSummary {}
export interface LeadsData {
  entries: LeadsEntry[]
  summary: LeadsSummary
}

export interface FreeTrialsEntry extends BaseEntry {}
export interface FreeTrialsSummary extends BaseSummary {}
export interface FreeTrialsData {
  entries: FreeTrialsEntry[]
  summary: FreeTrialsSummary
}

// Home Dashboard Types
export interface MrrEntry {
  date: string
  new_biz_mrr: number
  new_biz_count: number
  new_biz_activity_count: number
  new_biz_customer_count: number
  expansion_mrr: number
  expansion_count: number
  expansion_activity_count: number
  expansion_customer_count: number
  contraction_mrr: number
  contraction_count: number
  contraction_activity_count: number
  contraction_customer_count: number
  churn_mrr: number
  churn_count: number
  churn_activity_count: number
  churn_customer_count: number
  reactivation_mrr: number
  reactivation_count: number
  reactivation_activity_count: number
  reactivation_customer_count: number
  entered_mrr: number
  entered_count: number
  entered_activity_count: number
  entered_customer_count: number
  left_mrr: number
  left_count: number
  left_activity_count: number
  left_customer_count: number
  net_movement_mrr: number
  net_movement_arr: number
  original_new_biz_mrr: null
  original_new_biz_activity_count: null
  original_new_biz_customer_count: null
  original_churn_mrr: null
  original_churn_activity_count: null
  original_churn_customer_count: null
  original_reactivation_mrr: null
  original_reactivation_activity_count: null
  original_reactivation_customer_count: null
  reclassified_new_biz_mrr: null
  reclassified_new_biz_activity_count: null
  reclassified_new_biz_customer_count: null
  reclassified_churn_mrr: null
  reclassified_churn_activity_count: null
  reclassified_churn_customer_count: null
  reclassified_reactivation_mrr: null
  reclassified_reactivation_activity_count: null
  reclassified_reactivation_customer_count: null
  "percentage-change"?: null
}

export interface MrrData {
  entries: MrrEntry[]
  summary: any[]
}

export interface ArrEntry {
  date: string
  value: number
  value_in_usd: number
  "percentage-change"?: number | null
}

export interface ArrData {
  entries: ArrEntry[]
  summary: BaseSummary | any[]
}

export interface ArpaEntry extends BaseEntry {}
export interface ArpaData {
  entries: ArpaEntry[]
  summary: BaseSummary
}

export interface SubscribersEntry extends BaseEntry {}
export interface SubscribersData {
  entries: SubscribersEntry[]
  summary: BaseSummary
}

export interface ArrCohortsEntry {
  date: string
  value: number
  value_in_usd: number
  "percentage-change"?: number | null
}

export interface ArrCohortsData {
  cohort2020: ArrCohortsEntry[]
  cohort2021: ArrCohortsEntry[]
  cohort2022: ArrCohortsEntry[]
  cohort2023: ArrCohortsEntry[]
  cohort2024: ArrCohortsEntry[]
}

export interface NewBizReactivationEntry extends MrrEntry {}
export interface NewBizReactivationData {
  entries: NewBizReactivationEntry[]
  summary: any[]
}

// Card-specific types
export interface TopWinsEntry {
  customer: string
  mrr: number
  arr: number
  plan: string
}

export interface MrrBreakdownEntry {
  count: number
  label: string
  amount: number
  isPositive: boolean
}

// Dashboard component prop types
export interface LeadsChartProps {
  data: LeadsEntry[]
  summary: LeadsSummary
}

export interface FreeTrialsChartProps {
  data: FreeTrialsEntry[]
}

export interface MrrMovementsChartProps {
  data: MrrEntry[]
}

export interface ArrChartProps {
  data: ArrEntry[]
}

export interface MrrCardProps {
  data: ArrEntry[]
}

export interface SubscribersChartProps {
  data: SubscribersEntry[]
}

export interface ArpaChartProps {
  data: ArpaEntry[]
}

export interface ArrCohortsChartProps {
  data: ArrCohortsData
}

export interface NewBizReactivationChartProps {
  data: NewBizReactivationEntry[]
}

// Combined dashboard data types
export interface MarketingDashboardData {
  leads: LeadsData
  freeTrials: FreeTrialsData
}

export interface HomeDashboardData {
  mrr: MrrData
  arr: ArrData
  arpa: ArpaData
  subscribers: SubscribersData
  arrCohorts: ArrCohortsData
  newBizReactivation: NewBizReactivationData
  topWins: TopWinsEntry[]
  mrrBreakdown: MrrBreakdownEntry[]
}

// Dashboard configuration types
export interface GridPosition {
  x: number
  y: number
  width: number
  height: number
}

export interface ChartConfig {
  shape: 'bar' | 'line' | 'area' | 'pie'
  interval: 'day' | 'week' | 'month' | 'quarter' | 'year'
  interval_count: number
}

export interface CustomerListConfig {
  column_count: number
}

export type DashboardWidgetKind = 
  | 'mrr_breakdown'
  | 'customer_list'
  | 'chart'
  | 'custom_chart'

export type DashboardMetric = 
  | 'customer_activity'
  | 'customer_list'
  | 'mrr_movements'
  | 'arr_growth'
  | 'mrr_growth'
  | 'customer_growth'
  | 'arpa'

export interface DashboardWidget {
  grid: GridPosition
  kind: DashboardWidgetKind
  metric: DashboardMetric
  url?: string
  config?: CustomerListConfig
  chart?: ChartConfig
}

export interface DashboardConfig {
  widgets: DashboardWidget[]
}

// Home dashboard configuration
export const homeDashboardConfig: DashboardConfig = {
  widgets: [
    {
      grid: {
        x: 0,
        y: 0,
        width: 1,
        height: 3
      },
      kind: "mrr_breakdown",
      metric: "customer_activity"
    },
    {
      url: "/customers/lists/RV5Jp/page/1",
      grid: {
        x: 1,
        y: 0,
        width: 1,
        height: 3
      },
      kind: "customer_list",
      config: {
        column_count: 4
      },
      metric: "customer_list"
    },
    {
      url: "/reports/charts/mrr-movements?type=bar&interval=month&start=24.month.ago",
      grid: {
        x: 0,
        y: 3,
        width: 1,
        height: 3
      },
      kind: "chart",
      chart: {
        shape: "bar",
        interval: "month",
        interval_count: 24
      },
      metric: "mrr_movements"
    },
    {
      url: "/reports/charts/arr?type=line&interval=month&start=24.month.ago",
      grid: {
        x: 1,
        y: 3,
        width: 1,
        height: 2
      },
      kind: "chart",
      chart: {
        shape: "line",
        interval: "month",
        interval_count: 24
      },
      metric: "arr_growth"
    },
    {
      url: "/reports/charts/mrr",
      grid: {
        x: 1,
        y: 5,
        width: 1,
        height: 1
      },
      kind: "chart",
      metric: "mrr_growth"
    },
    {
      url: "/reports/charts/lKQeK",
      grid: {
        x: 0,
        y: 6,
        width: 1,
        height: 3
      },
      kind: "custom_chart",
      metric: "mrr_movements"
    },
    {
      url: "/reports/charts/subscribers?type=line&interval=month&start=24.month.ago",
      grid: {
        x: 1,
        y: 6,
        width: 1,
        height: 2
      },
      kind: "chart",
      chart: {
        shape: "line",
        interval: "month",
        interval_count: 24
      },
      metric: "customer_growth"
    },
    {
      url: "/reports/charts/arpa?type=line&interval=month&start=24.month.ago",
      grid: {
        x: 0,
        y: 9,
        width: 1,
        height: 2
      },
      kind: "chart",
      chart: {
        shape: "line",
        interval: "month",
        interval_count: 24
      },
      metric: "arpa"
    },
    {
      url: "/reports/charts/dq5yD",
      grid: {
        x: 1,
        y: 8,
        width: 1,
        height: 3
      },
      kind: "custom_chart",
      metric: "arr_growth"
    }
  ]
}
