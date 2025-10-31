import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface ChartEntry {
  date: string
  value: number
  "percentage-change"?: number | null
}

export interface SeriesConfig {
  name: string
  data: ChartEntry[]
  color: string
  lineWidth?: number
  showArea?: boolean
  areaOpacity?: number
}

export interface BaseMultiLineChartProps {
  series: SeriesConfig[]
  title: string
  valueFormatter: (value: number) => string
  showLegend?: boolean
  height?: number
  currentValue?: number
}

export function BaseMultiLineChart({
  series,
  title,
  valueFormatter,
  showLegend = true,
  height,
  currentValue
}: BaseMultiLineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

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
          console.warn(`Multi-line chart container has no dimensions, retry ${retryCount}/${maxRetries}...`)
          setTimeout(initializeChart, retryDelay)
          return
        } else {
          console.error('Multi-line chart container still has no dimensions after max retries')
          return
        }
      }

      // Initialize or update chart
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current)
      }

      // Prepare data for ECharts - use the first series for dates
      const dates = series[0].data.map(item => {
        const date = new Date(item.date)
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      })

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
            const dataIndex = params[0].dataIndex
            const originalDate = series[0].data[dataIndex].date
            const date = new Date(originalDate)
            const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

            let tooltip = `<div style="font-weight: bold;">${monthYear}</div>`

            params.forEach((param: any) => {
              if (param.value > 0) {
                const formattedValue = valueFormatter(param.value)

                // Find the corresponding series config
                const seriesConfig = series.find(s => s.name === param.seriesName)
                if (!seriesConfig) return

                // Add percentage change if available
                let changeText = ''
                const entry = seriesConfig.data[dataIndex]
                if (entry && entry['percentage-change'] !== undefined && entry['percentage-change'] !== null) {
                  const changeSign = entry['percentage-change'] > 0 ? '+' : ''
                  const changeColor = entry['percentage-change'] > 0 ? '#10b981' : '#ef4444'
                  changeText = `<span style="color: ${changeColor}; font-size: 11px;"> (${changeSign}${entry['percentage-change']}%)</span>`
                }

                tooltip += `<div style="display: flex; align-items: center; margin: 2px 0;">
                  <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 2px; margin-right: 8px;"></span>
                  <span>${param.seriesName}: ${formattedValue}${changeText}</span>
                </div>`
              }
            })

            return tooltip
          },
        },
        legend: showLegend ? {
          data: series.map(s => s.name),
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
        series: series.map(seriesConfig => {
          const seriesOption: any = {
            name: seriesConfig.name,
            type: 'line',
            data: seriesConfig.data.map(item => item.value),
            smooth: false,
            lineStyle: {
              color: seriesConfig.color,
              width: seriesConfig.lineWidth || 2
            },
            itemStyle: {
              color: seriesConfig.color
            }
          }

          if (seriesConfig.showArea) {
            const opacity = seriesConfig.areaOpacity || 0.3
            seriesOption.areaStyle = {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                  offset: 0,
                  color: `${seriesConfig.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
                }, {
                  offset: 1,
                  color: `${seriesConfig.color}0d`
                }]
              }
            }
          }

          return seriesOption
        })
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
  }, [series, valueFormatter, showLegend])

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
        {currentValue !== undefined && (
          <div className="flex items-center">
            <div className="text-2xl font-bold">{valueFormatter(currentValue)}</div>
          </div>
        )}
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
