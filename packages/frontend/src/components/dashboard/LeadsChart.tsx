import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LeadsChartProps } from '../../types/dashboardData'

export function LeadsChart({ data, summary }: LeadsChartProps) {
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

    const values = data.map((item, index) => ({
      value: item.value,
      itemStyle: {
        color: index === data.length - 1 ? '#60a5fa' : '#3b82f6' // Medium blue for current month
      }
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
              <span>Leads: ${formattedValue}${changeText}</span>
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
          name: 'Leads',
          type: 'bar',
          data: values,
          emphasis: {
            itemStyle: {
              color: '#2563eb'
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

  // Use summary data instead of calculating
  const currentLeads = summary.current
  const percentageChange = summary['percentage-change']

  const getChangeColor = (change: number | null) => {
    if (change === null) return '#6b7280'
    return change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280'
  }

  const getChangeText = (change: number | null) => {
    if (change === null) return 'No data'
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  return (
    <Card className="h-[320px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          Leads
        </CardTitle>
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold">{formatNumber(currentLeads)}</div>
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
