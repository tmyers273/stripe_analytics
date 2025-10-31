import { BaseBarChart } from '../charts/BaseBarChart'
import { LeadsChartProps } from '../../types/dashboardData'

export function LeadsChart({ data, summary }: LeadsChartProps) {
  const formatNumber = (value: number) => {
    return value.toLocaleString()
  }

  return (
    <BaseBarChart
      data={data}
      title="Leads"
      valueFormatter={formatNumber}
      color="#3b82f6"
      highlightLastBar={true}
      currentValue={summary.current}
      percentageChange={summary['percentage-change']}
    />
  )
}
