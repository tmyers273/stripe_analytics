import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface ChartEntry {
  date: string
  value: number
  "percentage-change"?: number | null
}

export interface BaseLineChartProps {
  data: ChartEntry[]
  title: string
  valueFormatter: (value: number) => string
  color?: string
  showArea?: boolean
  showLegend?: boolean
  seriesName?: string
  height?: number
}

export function BaseLineChart({ 
  data, 
  title, 
  valueFormatter,
  color = '#3b82f6',
  showArea = true,
  showLegend = false,
  seriesName = 'Value',
  height = 2
}: BaseLineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // Calculate current value and percentage change
  const currentEntry = data[data.length - 1]
  const previousEntry = data.length > 1 ? data[data.length - 2] : null
  
  const currentValue = currentEntry ? currentEntry.value : 0
  const percentageChange = currentEntry && previousEntry && previousEntry.value !== 0 
    ? ((currentEntry.value - previousEntry.value) / previousEntry.value) * 100
    : 0

  useEffect(() => {
    if (!chartRef.current) return

    let retryCount = 0
    const maxRetries = 10
    const retryDelay = 200

    const initializeChart = () => {
      if (!chartRef.current) return
      
      // Check if the container has valid dimensions
      const rect = chartRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        retryCount++
        if (retryCount <= maxRetries) {
          console.warn(`Chart container has no dimensions, retry ${retryCount}/${maxRetries}...`)
          setTimeout(initializeChart, retryDelay)
          return
        } else {
          console.error('Chart container still has no dimensions after max retries')
          return
        }
      }

      // Initialize or update chart
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current)
      }

      // Prepare data for ECharts
      const dates = data.map(item => {
        const date = new Date(item.date)
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      })

      const values = data.map(item => item.value)

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
            const formattedValue = valueFormatter(param.value)
            
            // Add percentage change if available
            let changeText = ''
            const entry = data[params[0].dataIndex]
            if (entry && entry['percentage-change'] !== undefined && entry['percentage-change'] !== null) {
              const changeSign = entry['percentage-change'] > 0 ? '+' : ''
              const changeColor = entry['percentage-change'] > 0 ? '#10b981' : '#ef4444'
              changeText = `<span style="color: ${changeColor}; font-size: 11px;"> (${changeSign}${entry['percentage-change']}%)</span>`
            }
            
            tooltip += `<div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 2px; margin-right: 8px;"></span>
              <span>${seriesName}: ${formattedValue}${changeText}</span>
            </div>`
          })
          
          return tooltip
        },
      },
      legend: showLegend ? {
        data: [seriesName],
        top: 0,
        textStyle: {
          fontSize: 12,
        },
      } : undefined,
      grid: {
        left: '0%',
        right: '0%',
        bottom: '0%',
        top: showLegend ? '15%' : '3%',
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
          name: seriesName,
          type: 'line',
          data: values,
          lineStyle: {
            color,
            width: 3
          },
          itemStyle: {
            color
          },
          areaStyle: showArea ? {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: `${color}4d` // Add transparency
              }, {
                offset: 1, color: `${color}0d` // Add more transparency
              }]
            }
          } : undefined
        }
      ]
    }

    chartInstance.current.setOption(option)
    }

    // Start initialization with a small delay
    const timer = setTimeout(initializeChart, 100)

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [data, valueFormatter, color, showArea, showLegend, seriesName, height])

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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          {title}
        </CardTitle>
        <div className="flex items-center">
          <div className="text-2xl font-bold">{valueFormatter(currentValue)}</div>
          <p className={`ml-2 text-xs ${
            percentageChange > 0 ? 'text-green-600' : 
            percentageChange < 0 ? 'text-red-600' : 
            'text-muted-foreground'
          }`}>
            {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2" style={{ height: 'calc(100% - 70px)' }}>
        <div 
          ref={chartRef} 
          style={{ width: '100%', height: '100%' }}
        />
      </CardContent>
    </Card>
  )
}
