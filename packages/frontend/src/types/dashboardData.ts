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
