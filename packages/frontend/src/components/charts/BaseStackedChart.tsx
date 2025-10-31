import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface StackedChartEntry {
  date: string
  [key: string]: any // Allow for various MRR component fields
}

export interface StackedChartSeries {
  name: string
  key: string
  color: string
}

export interface BaseStackedChartProps {
  data: StackedChartEntry[]
  title: string
  series: StackedChartSeries[]
  dateFormatter?: (date: string) => string
  valueFormatter?: (value: number) => string
  filterQuarterly?: boolean
  height?: string
  showRetry?: boolean
}

export function BaseStackedChart({
  data,
  title,
  series,
  dateFormatter,
  valueFormatter = (value: number) => `$${(value / 100).toLocaleString()}`,
  filterQuarterly = false,
  height = '320px',
  showRetry = false
}: BaseStackedChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    let retryCount = 0
    const maxRetries = 10
    const retryDelay = 200

    const initializeChart = () => {
      if (!chartRef.current) return

      // Check if the container has valid dimensions (if showRetry is enabled)
      if (showRetry) {
        const rect = chartRef.current.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
          retryCount++
          if (retryCount <= maxRetries) {
            console.warn(`Stacked chart container has no dimensions, retry ${retryCount}/${maxRetries}...`)
            setTimeout(initializeChart, retryDelay)
            return
          } else {
            console.error('Stacked chart container still has no dimensions after max retries')
            return
          }
        }
      }

      // Initialize or update chart
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current)
      }

      // Filter for quarterly data if requested
      const chartData = filterQuarterly
        ? data.filter(item => {
            const date = new Date(item.date)
            const month = date.getMonth() + 1
            return month === 3 || month === 6 || month === 9 || month === 12
          })
        : data

      // Prepare data for ECharts
      const dates = chartData.map(item => {
        if (dateFormatter) {
          return dateFormatter(item.date)
        }
        const date = new Date(item.date)
        if (filterQuarterly) {
          return `Q${Math.floor((date.getMonth() + 3) / 3)} ${date.getFullYear()}`
        }
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      })

      const option: echarts.EChartsOption = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
          formatter: (params: any) => {
            const dataIndex = params[0].dataIndex
            const originalDate = chartData[dataIndex].date
            const date = new Date(originalDate)
            const displayDate = dateFormatter
              ? dateFormatter(originalDate)
              : (filterQuarterly
                ? `Q${Math.floor((date.getMonth() + 3) / 3)} ${date.getFullYear()}`
                : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))

            let tooltip = `<div style="font-weight: bold;">${displayDate}</div>`

            // Get previous data for comparison
            const currentIndex = params[0].dataIndex
            const previousData = currentIndex > 0 ? chartData[currentIndex - 1] : null
          
          let total = 0
          
          params.forEach((param: any) => {
            if (param.value !== 0) {
              const formattedValue = valueFormatter(param.value)
              
              // Calculate percentage change
              let changeText = ''
              if (previousData) {
                const currentValue = param.value
                const seriesConfig = series.find(s => s.name === param.seriesName)
                const previousValue = seriesConfig ? previousData[seriesConfig.key] || 0 : 0
                
                let percentChange = 0
                if (previousValue !== 0) {
                  percentChange = ((currentValue - previousValue) / Math.abs(previousValue)) * 100
                } else if (currentValue !== 0) {
                  percentChange = 999999
                }
                
                if (percentChange !== 0) {
                  let displayText = ''
                  if (Math.abs(percentChange) >= 999999) {
                    displayText = 'New'
                  } else {
                    const changeSign = percentChange > 0 ? '+' : ''
                    const changeColor = percentChange > 0 ? '#10b981' : '#ef4444'
                    displayText = `<span style="color: ${changeColor}; font-size: 11px;"> (${changeSign}${percentChange.toFixed(1)}%)</span>`
                  }
                  changeText = displayText
                }
              }
              
              tooltip += `<div style="display: flex; align-items: center; margin: 2px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 2px; margin-right: 8px;"></span>
                <span>${param.seriesName}: ${formattedValue}${changeText}</span>
              </div>`
              total += param.value
            }
          })
          
          // Add total
          const totalFormatted = valueFormatter(total)
          tooltip += `<div style="border-top: 1px solid #ccc; margin-top: 4px; padding-top: 4px; font-weight: bold;">
            Net: ${totalFormatted}
          </div>`
          
          return tooltip
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          show: false,
        },
      },
        series: series.map(seriesConfig => ({
          name: seriesConfig.name,
          type: 'bar',
          stack: 'total',
          barWidth: 'auto',
          barGap: '0%',
          barCategoryGap: '0%',
          emphasis: {
            focus: 'series',
          },
          data: chartData.map(item => item[seriesConfig.key] || 0),
          itemStyle: {
            color: seriesConfig.color,
          },
        }))
      }

      chartInstance.current.setOption(option)
    }

    // Start initialization with delay if retry is enabled
    const timer = showRetry ? setTimeout(initializeChart, 100) : null
    if (!showRetry) {
      initializeChart()
    }

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [data, series, dateFormatter, valueFormatter, filterQuarterly, showRetry])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [])

  // Calculate chart height
  const isFullHeight = height === '100%'
  const cardClass = isFullHeight ? 'h-full' : `h-[${height}]`
  const contentStyle = isFullHeight
    ? { height: 'calc(100% - 70px)' }
    : undefined
  const chartHeight = isFullHeight ? '100%' : '250px'

  return (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4" style={contentStyle}>
        <div
          ref={chartRef}
          style={{ width: '100%', height: chartHeight }}
        />
      </CardContent>
    </Card>
  )
}
