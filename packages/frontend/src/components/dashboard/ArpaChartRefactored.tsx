import { BaseLineChart, ChartEntry } from '@/components/charts/BaseLineChart'

interface ArpaChartProps {
  data: ChartEntry[]
  height?: number
}

export function ArpaChartRefactored({ data, height = 2 }: ArpaChartProps) {
  const formatCurrency = (value: number) => {
    const valueInDollars = value / 100 // Convert cents to dollars
    return `$${valueInDollars.toLocaleString()}`
  }

  return (
    <BaseLineChart
      data={data}
      title="Average Revenue per Account (ARPA)"
      valueFormatter={formatCurrency}
      color="#3b82f6"
      showArea={true}
      seriesName="ARPA"
      height={height}
    />
  )
}
