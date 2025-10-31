import { BaseLineChart, ChartEntry } from '@/components/charts/BaseLineChart'

interface CustomerChurnChartProps {
  data: ChartEntry[]
  height?: number
}

export function CustomerChurnChart({ data }: CustomerChurnChartProps) {
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  return (
    <BaseLineChart
      data={data}
      title="Customer Churn Rate"
      valueFormatter={formatPercentage}
      color="#ef4444"
      showArea={true}
      seriesName="Customer Churn Rate"
    />
  )
}
