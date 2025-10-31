import { BaseLineChart, ChartEntry } from '@/components/charts/BaseLineChart'

interface SubscribersChartProps {
  data: ChartEntry[]
  height?: number
}

export function SubscribersChartRefactored({ data, height = 2 }: SubscribersChartProps) {
  const formatNumber = (value: number) => {
    return value.toLocaleString()
  }

  return (
    <BaseLineChart
      data={data}
      title="Subscribers"
      valueFormatter={formatNumber}
      color="#3b82f6"
      showArea={true}
      seriesName="Subscribers"
      height={height}
    />
  )
}
