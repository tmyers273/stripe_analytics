import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArpaChartProps } from '../../types/dashboardData'

export function ArpaChart({ data, height }: ArpaChartProps & { height?: number }) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // Calculate current ARPA and percentage change
  const currentEntry = data[data.length - 1]
  const previousEntry = data.length > 1 ? data[data.length - 2] : null
  
  const currentArpa = currentEntry ? currentEntry.value : 0
  const percentageChange = currentEntry && previousEntry && previousEntry.value !== 0 
    ? ((currentEntry.value - previousEntry.value) / previousEntry.value) * 100
    : 0

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  useEffect(() => {
    if (!chartRef.current) return

    // Initialize or update chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    // Prepare data for ECharts
    const dates = data.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    })

    const arpaValues = data.map(item => item.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: (params: any) => {
          const originalDate = data[params[0].dataIndex].date
          const date = new Date(originalDate)
          const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          
          let tooltip = `<div style="font-weight: bold;">${monthYear}</div>`
          
          params.forEach((param: any) => {
            const formattedValue = formatCurrency(param.value)
            
            // Add percentage change if available
            let changeText = ''
            const entry = data[params[0].dataIndex]
            if (entry['percentage-change'] !== undefined && entry['percentage-change'] !== null) {
              const changeSign = entry['percentage-change'] > 0 ? '+' : ''
              const changeColor = entry['percentage-change'] > 0 ? '#10b981' : '#ef4444'
              changeText = `<span style="color: ${changeColor}; font-size: 11px;"> (${changeSign}${entry['percentage-change']}%)</span>`
            }
            
            tooltip += `<div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 2px; margin-right: 8px;"></span>
              <span>ARPA: ${formattedValue}${changeText}</span>
            </div>`
          })
          
          return tooltip
        },
      },
      grid: {
        left: '0%',
        right: '0%',
        bottom: '0%',
        top: '0%',
        containLabel: false,
      },
      xAxis: {
        show: false,
        type: 'category',
        data: dates
      },
      yAxis: {
        show: false,
        type: 'value'
      },
      series: [
        {
          name: 'ARPA',
          type: 'line',
          data: arpaValues,
          smooth: true,
          lineStyle: {
            color: '#3b82f6',
            width: 3
          },
          itemStyle: {
            color: '#3b82f6'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(59, 130, 246, 0.3)'
              }, {
                offset: 1, color: 'rgba(59, 130, 246, 0.05)'
              }]
            }
          }
        }
      ]
    }

    chartInstance.current.setOption(option)

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [data])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [])

  return (
    <Card style={{ height: `${height}px` }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          Average Revenue per Account (ARPA)
        </CardTitle>
        <div className="flex items-center">
          <div className="text-2xl font-bold">{formatCurrency(currentArpa)}</div>
          <p className={`ml-2 text-xs ${
            percentageChange > 0 ? 'text-green-600' : 
            percentageChange < 0 ? 'text-red-600' : 
            'text-muted-foreground'
          }`}>
            {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-2">
        <div 
          ref={chartRef} 
          style={{ width: '100%', height: '240px' }}
        />
      </CardContent>
    </Card>
  )
}
