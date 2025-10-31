import { BaseBarChart } from '../charts/BaseBarChart'
import { FreeTrialsChartProps } from '../../types/dashboardData'

export function FreeTrialsChart({ data }: FreeTrialsChartProps) {
  const formatNumber = (value: number) => {
    return value.toLocaleString()
  }

  return (
    <BaseBarChart
      data={data}
      title="Free Trials"
      valueFormatter={formatNumber}
      color="#10b981"
    />
  )
}
