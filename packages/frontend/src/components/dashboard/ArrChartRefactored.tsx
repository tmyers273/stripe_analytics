import { BaseLineChart, ChartEntry } from '@/components/charts/BaseLineChart'

interface ArrChartProps {
  data: ChartEntry[]
}

export function ArrChartRefactored({ data }: ArrChartProps) {
  const formatCurrency = (value: number) => {
    const valueInDollars = value / 100 // Convert cents to dollars
    if (valueInDollars >= 1000000) {
      return `$${(valueInDollars / 1000000).toFixed(1)}M`
    }
    return `$${valueInDollars.toLocaleString()}`
  }

  return (
    <BaseLineChart
      data={data}
      title="Annual Run Rate (ARR)"
      valueFormatter={formatCurrency}
      color="#3b82f6"
      showArea={true}
      seriesName="ARR"
    />
  )
}
