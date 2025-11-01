import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface ChartEntry {
  date: string
  value: number
  "percentage-change"?: number | null
}

export interface BaseBarChartProps {
  data: ChartEntry[]
  title: string
  valueFormatter: (value: number) => string
  color?: string
  highlightLastBar?: boolean
  height?: number
  currentValue?: number
  percentageChange?: number | null
}

export function BaseBarChart({
  data,
  title,
  valueFormatter,
  color = '#3b82f6',
  highlightLastBar = false,
  height: _height = 320,
  currentValue,
  percentageChange
}: BaseBarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // Calculate current value and percentage change if not provided
  const currentEntry = data[data.length - 1]
  const previousEntry = data.length > 1 ? data[data.length - 2] : null

  const displayValue = currentValue !== undefined ? currentValue : (currentEntry ? currentEntry.value : 0)
  const displayPercentageChange = percentageChange !== undefined
    ? percentageChange
    : (currentEntry && previousEntry && previousEntry.value !== 0
      ? ((currentEntry.value - previousEntry.value) / previousEntry.value) * 100
      : 0)

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

    const values = data.map((item, index) => ({
      value: item.value,
      itemStyle: highlightLastBar && index === data.length - 1
        ? { color: `${color}99` } // Lighter shade for last bar
        : { color }
    }))

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
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
              <span>${title}: ${formattedValue}${changeText}</span>
            </div>`
          })

          return tooltip
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          show: false
        }
      },
      series: [
        {
          name: title,
          type: 'bar',
          data: values,
          emphasis: {
            itemStyle: {
              color: `${color}cc`
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
  }, [data, valueFormatter, color, highlightLastBar, title])

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
    <Card className="h-[320px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          {title}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold">{valueFormatter(displayValue)}</div>
          <div
            className={`text-sm font-medium ${
              displayPercentageChange === null ? 'text-gray-500' :
              displayPercentageChange > 0 ? 'text-green-600' :
              displayPercentageChange < 0 ? 'text-red-600' :
              'text-gray-500'
            }`}
          >
            {displayPercentageChange === null
              ? 'No data'
              : `${displayPercentageChange > 0 ? '+' : ''}${displayPercentageChange.toFixed(2)}%`
            }
          </div>
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
