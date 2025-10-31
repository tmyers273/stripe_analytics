import { BaseEntry, BaseSummary } from '../types/dashboardData'

export interface CustomerChurnEntry extends BaseEntry {}
export interface CustomerChurnSummary extends BaseSummary {}

export interface CustomerChurnData {
  entries: CustomerChurnEntry[]
  summary: CustomerChurnSummary
}

export const customerChurnData: CustomerChurnData = {
  entries: [
    {
      date: "2023-10-31",
      value: 0,
      "percentage-change": null
    },
    {
      date: "2023-11-30",
      value: 6.07,
      "percentage-change": null
    },
    {
      date: "2023-12-31",
      value: 5.9,
      "percentage-change": -2.8
    },
    {
      date: "2024-01-31",
      value: 3.97,
      "percentage-change": -32.71
    },
    {
      date: "2024-02-29",
      value: 5.4,
      "percentage-change": 36.02
    },
    {
      date: "2024-03-31",
      value: 4.27,
      "percentage-change": -20.93
    },
    {
      date: "2024-04-30",
      value: 3.69,
      "percentage-change": -13.58
    },
    {
      date: "2024-05-31",
      value: 5.54,
      "percentage-change": 50.14
    },
    {
      date: "2024-06-30",
      value: 4.51,
      "percentage-change": -18.59
    },
    {
      date: "2024-07-31",
      value: 4.44,
      "percentage-change": -1.55
    },
    {
      date: "2024-08-31",
      value: 4.2,
      "percentage-change": -5.41
    },
    {
      date: "2024-09-30",
      value: 4.98,
      "percentage-change": 18.57
    },
    {
      date: "2024-10-31",
      value: 4.2,
      "percentage-change": -15.66
    },
    {
      date: "2024-11-30",
      value: 4,
      "percentage-change": -4.76
    },
    {
      date: "2024-12-31",
      value: 5.06,
      "percentage-change": 26.5
    },
    {
      date: "2025-01-31",
      value: 10.29,
      "percentage-change": 103.36
    },
    {
      date: "2025-02-28",
      value: 4.93,
      "percentage-change": -52.09
    },
    {
      date: "2025-03-31",
      value: 4.65,
      "percentage-change": -5.68
    },
    {
      date: "2025-04-30",
      value: 4.68,
      "percentage-change": 0.65
    },
    {
      date: "2025-05-31",
      value: 4.52,
      "percentage-change": -3.42
    },
    {
      date: "2025-06-30",
      value: 5.39,
      "percentage-change": 19.25
    },
    {
      date: "2025-07-31",
      value: 5.42,
      "percentage-change": 0.56
    },
    {
      date: "2025-08-31",
      value: 5.65,
      "percentage-change": 4.24
    },
    {
      date: "2025-09-30",
      value: 5.06,
      "percentage-change": -10.44
    },
    {
      date: "2025-10-31",
      value: 5.74,
      "percentage-change": 13.44
    }
  ],
  summary: {
    metric: "customers_churn",
    current: 5.06,
    previous: 5.65,
    "percentage-change": -10.44
  }
}
