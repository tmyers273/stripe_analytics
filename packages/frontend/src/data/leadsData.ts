export interface LeadsEntry {
  date: string
  value: number
  "percentage-change"?: number | null
}

export interface LeadsSummary {
  metric: string
  current: number
  previous: number
  "percentage-change": number
}

export interface LeadsData {
  entries: LeadsEntry[]
  summary: LeadsSummary
}

export const leadsData: LeadsData = {
  "entries": [
    {
      "date": "2023-10-31",
      "value": 0
    },
    {
      "date": "2023-11-30",
      "value": 1,
      "percentage-change": null
    },
    {
      "date": "2023-12-31",
      "value": 2,
      "percentage-change": 100
    },
    {
      "date": "2024-01-31",
      "value": 3,
      "percentage-change": 50
    },
    {
      "date": "2024-02-29",
      "value": 6,
      "percentage-change": 100
    },
    {
      "date": "2024-03-31",
      "value": 114,
      "percentage-change": 1800
    },
    {
      "date": "2024-04-30",
      "value": 129,
      "percentage-change": 13.16
    },
    {
      "date": "2024-05-31",
      "value": 123,
      "percentage-change": -4.65
    },
    {
      "date": "2024-06-30",
      "value": 29,
      "percentage-change": -76.42
    },
    {
      "date": "2024-07-31",
      "value": 796,
      "percentage-change": 2644.83
    },
    {
      "date": "2024-08-31",
      "value": 2161,
      "percentage-change": 171.48
    },
    {
      "date": "2024-09-30",
      "value": 1685,
      "percentage-change": -22.03
    },
    {
      "date": "2024-10-31",
      "value": 1756,
      "percentage-change": 4.21
    },
    {
      "date": "2024-11-30",
      "value": 1695,
      "percentage-change": -3.47
    },
    {
      "date": "2024-12-31",
      "value": 1304,
      "percentage-change": -23.07
    },
    {
      "date": "2025-01-31",
      "value": 1887,
      "percentage-change": 44.71
    },
    {
      "date": "2025-02-28",
      "value": 1674,
      "percentage-change": -11.29
    },
    {
      "date": "2025-03-31",
      "value": 1634,
      "percentage-change": -2.39
    },
    {
      "date": "2025-04-30",
      "value": 1519,
      "percentage-change": -7.04
    },
    {
      "date": "2025-05-31",
      "value": 1462,
      "percentage-change": -3.75
    },
    {
      "date": "2025-06-30",
      "value": 1329,
      "percentage-change": -9.1
    },
    {
      "date": "2025-07-31",
      "value": 1482,
      "percentage-change": 11.51
    },
    {
      "date": "2025-08-31",
      "value": 1507,
      "percentage-change": 1.69
    },
    {
      "date": "2025-09-30",
      "value": 1377,
      "percentage-change": -8.63
    },
    {
      "date": "2025-10-31",
      "value": 1318,
      "percentage-change": -4.28
    }
  ],
  "summary": {
    "metric": "leads",
    "current": 1259,
    "previous": 1386,
    "percentage-change": -9.16
  }
}
