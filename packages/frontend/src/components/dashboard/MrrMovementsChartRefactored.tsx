import { BaseStackedChart, StackedChartSeries } from '@/components/charts/BaseStackedChart'

interface MrrMovementsChartProps {
  data: any[]
}

export function MrrMovementsChartRefactored({ data }: MrrMovementsChartProps) {
  const series: StackedChartSeries[] = [
    {
      name: 'Churn',
      key: 'churn_mrr',
      color: '#ef4444'
    },
    {
      name: 'Contraction',
      key: 'contraction_mrr',
      color: '#dc2626'
    },
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
      title="MRR Movements - Stacked Bar Chart"
      series={series}
    />
  )
}
