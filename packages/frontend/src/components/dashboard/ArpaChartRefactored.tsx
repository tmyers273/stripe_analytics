import { BaseLineChart, ChartEntry } from '@/components/charts/BaseLineChart'

interface ArpaChartProps {
  data: ChartEntry[]
}

export function ArpaChartRefactored({ data }: ArpaChartProps) {
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  return (
    <BaseLineChart
      data={data}
      title="Average Revenue per Account (ARPA)"
      valueFormatter={formatCurrency}
      color="#3b82f6"
      showArea={true}
      seriesName="ARPA"
    />
  )
}
