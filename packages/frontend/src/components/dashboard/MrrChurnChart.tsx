import { BaseLineChart, ChartEntry } from '@/components/charts/BaseLineChart'

interface MrrChurnChartProps {
  data: ChartEntry[]
  height?: number
}

export function MrrChurnChart({ data }: MrrChurnChartProps) {
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  return (
    <BaseLineChart
      data={data}
      title="Net MRR Churn Rate"
      valueFormatter={formatPercentage}
      color="#ef4444"
      showArea={true}
      seriesName="MRR Churn Rate"
    />
  )
}
