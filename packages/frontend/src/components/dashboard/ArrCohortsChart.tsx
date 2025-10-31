import { BaseMultiLineChart, SeriesConfig } from '../charts/BaseMultiLineChart'
import { ArrCohortsChartProps } from '../../types/dashboardData'

export function ArrCohortsChart({ data }: ArrCohortsChartProps) {
  // Calculate current total ARR across all cohorts
  const currentCohort2020 = data.cohort2020[data.cohort2020.length - 1]
  const currentCohort2021 = data.cohort2021[data.cohort2021.length - 1]
  const currentCohort2022 = data.cohort2022[data.cohort2022.length - 1]
  const currentCohort2023 = data.cohort2023[data.cohort2023.length - 1]
  const currentCohort2024 = data.cohort2024[data.cohort2024.length - 1]

  // Values are in cents, convert to dollars
  const currentTotalArr = ((currentCohort2020?.value_in_usd || 0) +
                         (currentCohort2021?.value_in_usd || 0) +
                         (currentCohort2022?.value_in_usd || 0) +
                         (currentCohort2023?.value_in_usd || 0) +
                         (currentCohort2024?.value_in_usd || 0)) / 100

  const formatCurrency = (value: number) => {
    // Value is already in dollars (converted from cents in convertToChartEntries)
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return `$${value.toLocaleString()}`
  }

  // Convert cohort data to chart entries format - convert cents to dollars
  const convertToChartEntries = (cohortData: any[]) => {
    return cohortData.map(item => ({
      date: item.date,
      value: item.value_in_usd / 100, // Convert cents to dollars
      'percentage-change': item['percentage-change']
    }))
  }

  const series: SeriesConfig[] = [
    {
      name: '2020 Cohort',
      data: convertToChartEntries(data.cohort2020),
      color: '#ef4444',
      lineWidth: 2,
      showArea: false
    },
    {
      name: '2021 Cohort',
      data: convertToChartEntries(data.cohort2021),
      color: '#f97316',
      lineWidth: 2,
      showArea: false
    },
    {
      name: '2022 Cohort',
      data: convertToChartEntries(data.cohort2022),
      color: '#eab308',
      lineWidth: 2,
      showArea: false
    },
    {
      name: '2023 Cohort',
      data: convertToChartEntries(data.cohort2023),
      color: '#22c55e',
      lineWidth: 3,
      showArea: true,
      areaOpacity: 0.3
    },
    {
      name: '2024 Cohort',
      data: convertToChartEntries(data.cohort2024),
      color: '#8b5cf6',
      lineWidth: 3,
      showArea: true,
      areaOpacity: 0.3
    }
  ]

  return (
    <BaseMultiLineChart
      series={series}
      title="ARR Cohorts"
      valueFormatter={formatCurrency}
      showLegend={true}
      currentValue={currentTotalArr}
    />
  )
}
