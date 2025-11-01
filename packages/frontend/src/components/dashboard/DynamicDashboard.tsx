import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import GridLayout, { Layout } from 'react-grid-layout'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardWidget, DashboardConfig } from '../../types/dashboardData'
import { TopWinsCard } from './TopWinsCard'
import { MrrBreakdownCard } from './MrrBreakdownCard'
import { MrrMovementsChartRefactored } from './MrrMovementsChartRefactored'
import { ArrChartRefactored } from './ArrChartRefactored'
import { MrrCard } from './MrrCard'
import { SubscribersChartRefactored } from './SubscribersChartRefactored'
import { ArpaChartRefactored } from './ArpaChartRefactored'
import { ArrCohortsChart } from './ArrCohortsChart'
import { NewBizReactivationChart } from './NewBizReactivationChart'
import { mrrData, arrDataNew, mrrGrowthData } from '../../data/mrrData'
import { newBizReactivationData } from '../../data/newBizReactivationData'
import { subscribersData } from '../../data/subscribersData'
import { arpaData } from '../../data/arpaData'
import { arrCohortsData } from '../../data/arrCohortsData'
import { leadsData } from '../../data/leadsData'
import { freeTrialsData } from '../../data/freeTrialsData'
import { LeadsChart } from './LeadsChart'
import { FreeTrialsChart } from './FreeTrialsChart'
import { mrrChurnData } from '../../data/mrrChurnData'
import { customerChurnData } from '../../data/customerChurnData'
import { MrrChurnChart } from './MrrChurnChart'
import { CustomerChurnChart } from './CustomerChurnChart'
import { dashboardStore } from '../../stores/dashboardStore'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

interface DynamicDashboardProps {
  config: DashboardConfig
  dashboardId?: string
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
          return <NewBizReactivationChart data={newBizReactivationData.entries} />
        }
        return <MrrMovementsChartRefactored data={mrrData.entries} />

      case 'arr_growth':
        if (widget.kind === 'custom_chart') {
          return <ArrCohortsChart data={arrCohortsData} />
        }
        return <ArrChartRefactored data={arrDataNew.entries} />
      
      case 'mrr_growth':
        return <MrrCard data={mrrGrowthData.entries} />
      
      case 'customer_growth':
        return <SubscribersChartRefactored data={subscribersData.entries} />
      
      case 'arpa':
        return <ArpaChartRefactored data={arpaData.entries} />

      case 'leads':
        return <LeadsChart data={leadsData.entries} summary={leadsData.summary} />

      case 'free_trials':
        return <FreeTrialsChart data={freeTrialsData.entries} />

      case 'mrr_churn_rate':
        return <MrrChurnChart data={mrrChurnData.entries} />

      case 'customer_churn_rate':
        return <CustomerChurnChart data={customerChurnData.entries} />

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

export const DynamicDashboard: React.FC<DynamicDashboardProps> = observer(({ config }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)
  const [isDragging, setIsDragging] = useState(false)

  // Measure container width for responsive grid
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Convert DashboardWidget grid positions to react-grid-layout Layout format
  const layout = useMemo(() => {
    return config.widgets.map((widget, index) => ({
      i: `widget-${index}`,
      x: widget.grid.x,
      y: widget.grid.y,
      w: widget.grid.width,
      h: widget.grid.height,
      minW: 1,
      minH: 1,
    }))
  }, [config.widgets])

  // Save layout to backend - only called when drag/resize completes
  const saveLayout = useCallback((newLayout: Layout[]) => {
    if (!dashboardStore.activeDashboard) return

    // Convert react-grid-layout Layout back to our DashboardWidget format
    const updatedWidgets = config.widgets.map((widget, index) => {
      const layoutItem = newLayout.find(l => l.i === `widget-${index}`)
      if (!layoutItem) return widget

      return {
        ...widget,
        grid: {
          x: layoutItem.x,
          y: layoutItem.y,
          width: layoutItem.w,
          height: layoutItem.h,
        },
      }
    })

    // Update the dashboard with new widget positions
    const updatedDashboard = {
      ...dashboardStore.activeDashboard,
      widgets: updatedWidgets,
    }

    // Save to backend
    dashboardStore.saveDashboard(updatedDashboard)
  }, [config.widgets])

  // Called when drag starts
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  // Called when drag completes
  const handleDragStop = useCallback((layout: Layout[]) => {
    setIsDragging(false)
    if (!dashboardStore.isEditMode) return
    saveLayout(layout)
  }, [saveLayout])

  // Called when resize starts
  const handleResizeStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  // Called when resize completes
  const handleResizeStop = useCallback((layout: Layout[]) => {
    setIsDragging(false)
    if (!dashboardStore.isEditMode) return
    saveLayout(layout)
  }, [saveLayout])

  // We want H3 = 320px including gaps between widgets
  // H3 = (3 * rowHeight) + (2 * rowGap) = 320px
  // With 8px gap: 3 * rowHeight + 16px = 320px
  // So rowHeight = (320px - 16px) / 3 = 101.33px
  const rowHeight = 101.33

  return (
    <div ref={containerRef} className="w-full">
      <GridLayout
        className="layout"
        layout={layout}
        cols={2}
        rowHeight={rowHeight}
        width={containerWidth}
        isDraggable={dashboardStore.isEditMode}
        isResizable={dashboardStore.isEditMode}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        compactType="vertical"
        preventCollision={false}
        containerPadding={[0, 0]}
        margin={[8, 8]}
      >
        {config.widgets.map((widget, index) => (
          <div key={`widget-${index}`} className="w-full h-full">
            <motion.div
              layout
              transition={{
                type: 'spring',
                stiffness: isDragging ? 250 : 120,
                damping: isDragging ? 12 : 20,
              }}
              animate={isDragging ? {
                boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.15)',
              } : {
                boxShadow: 'none',
              }}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            >
              <WidgetRenderer widget={widget} />
            </motion.div>
          </div>
        ))}
      </GridLayout>
    </div>
  )
})
