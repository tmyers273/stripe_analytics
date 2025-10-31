import { BaseStackedChart, StackedChartSeries } from '../charts/BaseStackedChart'
import { NewBizReactivationChartProps } from '../../types/dashboardData'

export function NewBizReactivationChart({ data }: NewBizReactivationChartProps) {
  const series: StackedChartSeries[] = [
    {
      name: 'New Business',
      key: 'new_biz_mrr',
      color: '#3b82f6'
    },
    {
      name: 'Expansion',
      key: 'expansion_mrr',
      color: '#60a5fa'
    },
    {
      name: 'Reactivation',
      key: 'reactivation_mrr',
      color: '#93c5fd'
    }
  ]

  return (
    <BaseStackedChart
      data={data}
      title="New Biz + Reactivations - Quarterly Growth"
      series={series}
      filterQuarterly={true}
      height="100%"
      showRetry={true}
    />
  )
}
