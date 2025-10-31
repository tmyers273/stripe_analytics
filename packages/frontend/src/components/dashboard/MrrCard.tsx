import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { MrrCardProps } from '../../types/dashboardData'

export function MrrCard({ data }: MrrCardProps) {
  // Calculate current MRR and percentage change from summary data
  const currentEntry = data[data.length - 1]
  const previousEntry = data.length > 1 ? data[data.length - 2] : null
  
  const currentMrr = currentEntry ? currentEntry.value / 100 : 0 // Convert cents to dollars
  const percentageChange = currentEntry && previousEntry && previousEntry.value !== 0 
    ? ((currentEntry.value - previousEntry.value) / previousEntry.value) * 100
    : 0

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return `$${value.toLocaleString()}`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          MRR
        </CardTitle>
        <div className="flex items-center">
          <div className="text-2xl font-bold">{formatCurrency(currentMrr)}</div>
          <p className={`ml-2 text-xs ${
            percentageChange > 0 ? 'text-green-600' : 
            percentageChange < 0 ? 'text-red-600' : 
            'text-muted-foreground'
          }`}>
            {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}% from last 30 days
          </p>
        </div>
      </CardHeader>
    </Card>
  )
}
