import { BaseEntry, BaseSummary } from '../types/dashboardData'

export interface MrrChurnEntry extends BaseEntry {}
export interface MrrChurnSummary extends BaseSummary {}

export interface MrrChurnData {
  entries: MrrChurnEntry[]
  summary: MrrChurnSummary
}

export const mrrChurnData: MrrChurnData = {
  entries: [
    {
      date: "2023-10-31",
      value: 0
    },
    {
      date: "2023-11-30",
      value: 5.26,
      "percentage-change": null
    },
    {
      date: "2023-12-31",
      value: 5.92,
      "percentage-change": 12.55
    },
    {
      date: "2024-01-31",
      value: 4.02,
      "percentage-change": -32.09
    },
    {
      date: "2024-02-29",
      value: 4.6,
      "percentage-change": 14.43
    },
    {
      date: "2024-03-31",
      value: 4.37,
      "percentage-change": -5
    },
    {
      date: "2024-04-30",
      value: 3.42,
      "percentage-change": -21.74
    },
    {
      date: "2024-05-31",
      value: 5.04,
      "percentage-change": 47.37
    },
    {
      date: "2024-06-30",
      value: 3.9,
      "percentage-change": -22.62
    },
    {
      date: "2024-07-31",
      value: 4.62,
      "percentage-change": 18.46
    },
    {
      date: "2024-08-31",
      value: 2.7,
      "percentage-change": -41.56
    },
    {
      date: "2024-09-30",
      value: 3.57,
      "percentage-change": 32.22
    },
    {
      date: "2024-10-31",
      value: 3.12,
      "percentage-change": -12.61
    },
    {
      date: "2024-11-30",
      value: 3.82,
      "percentage-change": 22.44
    },
    {
      date: "2024-12-31",
      value: 4.11,
      "percentage-change": 7.59
    },
    {
      date: "2025-01-31",
      value: 8.92,
      "percentage-change": 117.03
    },
    {
      date: "2025-02-28",
      value: 2.45,
      "percentage-change": -72.53
    },
    {
      date: "2025-03-31",
      value: 1.9,
      "percentage-change": -22.45
    },
    {
      date: "2025-04-30",
      value: 3.28,
      "percentage-change": 72.63
    },
    {
      date: "2025-05-31",
      value: 3.11,
      "percentage-change": -5.18
    },
    {
      date: "2025-06-30",
      value: 4.33,
      "percentage-change": 39.23
    },
    {
      date: "2025-07-31",
      value: 4.3,
      "percentage-change": -0.69
    },
    {
      date: "2025-08-31",
      value: 4.01,
      "percentage-change": -6.74
    },
    {
      date: "2025-09-30",
      value: 2.29,
      "percentage-change": -42.89
    },
    {
      date: "2025-10-31",
      value: 2.75,
      "percentage-change": 20.09
    }
  ],
  summary: {
    metric: "mrr_churn",
    current: 2.29,
    previous: 4.01,
    "percentage-change": -42.89
  }
}
