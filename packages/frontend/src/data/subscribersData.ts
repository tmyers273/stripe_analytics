export interface SubscribersEntry {
  date: string
  value: number
  "percentage-change"?: number
}

export const subscribersData: {
  entries: SubscribersEntry[]
  summary: {
    metric: string
    current: number
    previous: number
    "percentage-change": number
  }
} = {
  "entries": [
    {
      "date": "2023-10-31",
      "value": 577
    },
    {
      "date": "2023-11-30",
      "value": 644,
      "percentage-change": 11.61
    },
    {
      "date": "2023-12-31",
      "value": 705,
      "percentage-change": 9.47
    },
    {
      "date": "2024-01-31",
      "value": 796,
      "percentage-change": 12.91
    },
    {
      "date": "2024-02-29",
      "value": 914,
      "percentage-change": 14.82
    },
    {
      "date": "2024-03-31",
      "value": 1084,
      "percentage-change": 18.6
    },
    {
      "date": "2024-04-30",
      "value": 1246,
      "percentage-change": 14.94
    },
    {
      "date": "2024-05-31",
      "value": 1375,
      "percentage-change": 10.35
    },
    {
      "date": "2024-06-30",
      "value": 1508,
      "percentage-change": 9.67
    },
    {
      "date": "2024-07-31",
      "value": 1666,
      "percentage-change": 10.48
    },
    {
      "date": "2024-08-31",
      "value": 1787,
      "percentage-change": 7.26
    },
    {
      "date": "2024-09-30",
      "value": 1881,
      "percentage-change": 5.26
    },
    {
      "date": "2024-10-31",
      "value": 1998,
      "percentage-change": 6.22
    },
    {
      "date": "2024-11-30",
      "value": 2095,
      "percentage-change": 4.85
    },
    {
      "date": "2024-12-31",
      "value": 2147,
      "percentage-change": 2.48
    },
    {
      "date": "2025-01-31",
      "value": 2109,
      "percentage-change": -1.77
    },
    {
      "date": "2025-02-28",
      "value": 2195,
      "percentage-change": 4.08
    },
    {
      "date": "2025-03-31",
      "value": 2309,
      "percentage-change": 5.19
    },
    {
      "date": "2025-04-30",
      "value": 2413,
      "percentage-change": 4.5
    },
    {
      "date": "2025-05-31",
      "value": 2504,
      "percentage-change": 3.77
    },
    {
      "date": "2025-06-30",
      "value": 2545,
      "percentage-change": 1.64
    },
    {
      "date": "2025-07-31",
      "value": 2636,
      "percentage-change": 3.58
    },
    {
      "date": "2025-08-31",
      "value": 2728,
      "percentage-change": 3.49
    },
    {
      "date": "2025-09-30",
      "value": 2840,
      "percentage-change": 4.11
    },
    {
      "date": "2025-10-31",
      "value": 2902,
      "percentage-change": 2.18
    }
  ],
  "summary": {
    "metric": "customer_growth",
    "current": 2902,
    "previous": 2840,
    "percentage-change": 2.18
  }
}
