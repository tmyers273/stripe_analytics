import { BaseLineChart, ChartEntry } from '@/components/charts/BaseLineChart'

interface SubscribersChartProps {
  data: ChartEntry[]
}

export function SubscribersChartRefactored({ data }: SubscribersChartProps) {
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
    />
  )
}
