import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardWidget, DashboardConfig } from '../../types/dashboardData'
import { TopWinsCard } from './TopWinsCard'
import { MrrBreakdownCard } from './MrrBreakdownCard'
import { MrrMovementsChart } from './MrrMovementsChart'
import { ArrChart } from './ArrChart'
import { MrrCard } from './MrrCard'
import { SubscribersChart } from './SubscribersChart'
import { ArpaChart } from './ArpaChart'
import { ArrCohortsChart } from './ArrCohortsChart'
import { NewBizReactivationChart } from './NewBizReactivationChart'
import { mrrData, arrDataNew, mrrGrowthData } from '../../data/mrrData'
import { newBizReactivationData } from '../../data/newBizReactivationData'
import { subscribersData } from '../../data/subscribersData'
import { arpaData } from '../../data/arpaData'
import { arrCohortsData } from '../../data/arrCohortsData'

interface DynamicDashboardProps {
  config: DashboardConfig
}

const WidgetRenderer: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const renderWidgetContent = () => {
    switch (widget.metric) {
      case 'customer_activity':
        return <MrrBreakdownCard />
      
      case 'customer_list':
        return <TopWinsCard />
      
      case 'mrr_movements':
        if (widget.kind === 'custom_chart') {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Custom MRR Movements</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Custom chart widget</p>
                <p className="text-sm text-muted-foreground">URL: {widget.url}</p>
              </CardContent>
            </Card>
          )
        }
        return <MrrMovementsChart data={mrrData.entries} />
      
      case 'arr_growth':
        if (widget.kind === 'custom_chart') {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Custom ARR Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Custom chart widget</p>
                <p className="text-sm text-muted-foreground">URL: {widget.url}</p>
              </CardContent>
            </Card>
          )
        }
        return <ArrChart data={arrDataNew.entries} />
      
      case 'mrr_growth':
        return <MrrCard data={mrrGrowthData.entries} />
      
      case 'customer_growth':
        return <SubscribersChart data={subscribersData.entries} />
      
      case 'arpa':
        return <ArpaChart data={arpaData.entries} />
      
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Unknown Widget</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Widget kind: {widget.kind}</p>
              <p>Metric: {widget.metric}</p>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="w-full h-full">
      {renderWidgetContent()}
    </div>
  )
}

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({ config }) => {
  // Calculate the maximum grid position needed
  const maxX = Math.max(...config.widgets.map(w => w.grid.x + w.grid.width))
  const maxY = Math.max(...config.widgets.map(w => w.grid.y + w.grid.height))
  
  // We want H3 = 320px including gaps between widgets
  // H3 = (3 * rowHeight) + (2 * rowGap) = 320px
  // With 8px gap: 3 * rowHeight + 16px = 320px
  // So rowHeight = (320px - 16px) / 3 = 101.33px
  const rowHeight = 101.33
  
  return (
    <div className="grid grid-cols-2" style={{ 
      gridTemplateRows: `repeat(${maxY}, ${rowHeight}px)`,
      rowGap: '8px',
      columnGap: '8px'
    }}>
      {config.widgets.map((widget, index) => (
        <div 
          key={index}
          className="w-full"
          style={{
            gridColumn: `${widget.grid.x + 1} / span ${widget.grid.width}`,
            gridRow: `${widget.grid.y + 1} / span ${widget.grid.height}`,
          }}
        >
          <WidgetRenderer widget={widget} />
        </div>
      ))}
    </div>
  )
}
