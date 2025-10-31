import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { freeTrialsData, FreeTrialsEntry } from '@/data/freeTrialsData'

interface FreeTrialsChartProps {
  data: FreeTrialsEntry[]
}

export function FreeTrialsChart({ data }: FreeTrialsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  const formatNumber = (value: number) => {
    return value.toLocaleString()
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

    const values = data.map(item => item.value)

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
            const formattedValue = formatNumber(param.value)
            
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
              <span>Free Trials: ${formattedValue}${changeText}</span>
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
          name: 'Free Trials',
          type: 'bar',
          data: values,
          itemStyle: {
            color: '#10b981'
          },
          emphasis: {
            itemStyle: {
              color: '#059669'
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

  // Calculate current free trials and change
  const currentEntry = data[data.length - 1]
  const currentTrials = currentEntry?.value || 0
  const previousEntry = data[data.length - 2]
  const previousTrials = previousEntry?.value || 0
  const percentageChange = previousTrials > 0 ? ((currentTrials - previousTrials) / previousTrials * 100) : 0

  const getChangeColor = (change: number) => {
    return change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280'
  }

  const getChangeText = (change: number) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  return (
    <Card className="h-[320px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          Free Trials
        </CardTitle>
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold">{formatNumber(currentTrials)}</div>
          <div 
            className="text-sm font-medium"
            style={{ color: getChangeColor(percentageChange) }}
          >
            {getChangeText(percentageChange)}
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
