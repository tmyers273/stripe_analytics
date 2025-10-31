import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MrrData {
  date: string
  new_biz_mrr: number
  expansion_mrr: number
  contraction_mrr: number
  churn_mrr: number
  reactivation_mrr: number
  net_movement_mrr: number
}

interface MrrMovementsChartProps {
  data: MrrData[]
}

export function MrrMovementsChart({ data }: MrrMovementsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

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

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          // Get the original date from the data
          const originalDate = data[params[0].dataIndex].date
          const date = new Date(originalDate)
          const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          
          // Calculate date range (first day to last day of month)
          const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
          const firstDayFormatted = firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const lastDayFormatted = lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          
          let tooltip = `<div style="font-weight: bold;">${monthYear}</div>`
          tooltip += `<div style="font-size: 12px; color: #666; margin-bottom: 8px;">${firstDayFormatted} - ${lastDayFormatted}</div>`
          
          let total = 0
          
          // Get previous month data for comparison
          const currentIndex = params[0].dataIndex
          const previousMonthData = currentIndex > 0 ? data[currentIndex - 1] : null
          
          params.forEach((param: any) => {
            if (param.value !== 0) {
              // Convert cents to dollars
              const valueInDollars = param.value / 100
              const formattedValue = valueInDollars > 0 ? `+$${valueInDollars.toLocaleString()}` : `-$${Math.abs(valueInDollars).toLocaleString()}`
              
              // Calculate month-over-month percentage change
              let changeText = ''
              if (previousMonthData) {
                const currentValue = param.value
                let previousValue = 0
                
                switch(param.seriesName) {
                  case 'New Business':
                    previousValue = previousMonthData.new_biz_mrr
                    break
                  case 'Expansion':
                    previousValue = previousMonthData.expansion_mrr
                    break
                  case 'Reactivation':
                    previousValue = previousMonthData.reactivation_mrr
                    break
                  case 'Contraction':
                    previousValue = previousMonthData.contraction_mrr
                    break
                  case 'Churn':
                    previousValue = previousMonthData.churn_mrr
                    break
                }
                
                // Calculate percentage change
                let percentChange = 0
                if (previousValue !== 0) {
                  percentChange = ((currentValue - previousValue) / Math.abs(previousValue)) * 100
                } else if (currentValue !== 0) {
                  // If previous was 0 and current is not, show as "New"
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
          
          // Convert total to dollars and calculate percentage change
          const totalInDollars = total / 100
          let netChangeText = ''
          
          if (previousMonthData) {
            const previousTotal = previousMonthData.net_movement_mrr
            
            // Calculate percentage change
            let netPercentChange = 0
            if (previousTotal !== 0) {
              netPercentChange = ((total - previousTotal) / Math.abs(previousTotal)) * 100
            } else if (total !== 0) {
              // If previous was 0 and current is not, show as "New"
              netPercentChange = 999999
            }
            
            if (netPercentChange !== 0) {
              let displayText = ''
              if (Math.abs(netPercentChange) >= 999999) {
                displayText = 'New'
              } else {
                const changeSign = netPercentChange > 0 ? '+' : ''
                const changeColor = netPercentChange > 0 ? '#10b981' : '#ef4444'
                displayText = `<span style="color: ${changeColor}; font-size: 11px;"> (${changeSign}${netPercentChange.toFixed(1)}%)</span>`
              }
              netChangeText = displayText
            }
          }
          
          tooltip += `<div style="border-top: 1px solid #ccc; margin-top: 4px; padding-top: 4px; font-weight: bold;">
            Net: ${totalInDollars > 0 ? '+' : ''}$${totalInDollars.toLocaleString()}${netChangeText}
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
      series: [
        {
          name: 'Churn',
          type: 'bar',
          stack: 'total',
          barWidth: 'auto',
          barGap: '0%',
          barCategoryGap: '0%',
          emphasis: {
            focus: 'series',
          },
          data: data.map(item => item.churn_mrr), // Keep as negative values
          itemStyle: {
            color: '#ef4444', // red-500
          },
        },
        {
          name: 'Contraction',
          type: 'bar',
          stack: 'total',
          barWidth: 'auto',
          barGap: '0%',
          barCategoryGap: '0%',
          emphasis: {
            focus: 'series',
          },
          data: data.map(item => item.contraction_mrr), // Keep as negative values
          itemStyle: {
            color: '#dc2626', // red-600 (darker red)
          },
        },
        {
          name: 'New Business',
          type: 'bar',
          stack: 'total',
          barWidth: 'auto',
          barGap: '0%',
          barCategoryGap: '0%',
          emphasis: {
            focus: 'series',
          },
          data: data.map(item => item.new_biz_mrr),
          itemStyle: {
            color: '#3b82f6', // blue-500
          },
        },
        {
          name: 'Expansion',
          type: 'bar',
          stack: 'total',
          barWidth: 'auto',
          barGap: '0%',
          barCategoryGap: '0%',
          emphasis: {
            focus: 'series',
          },
          data: data.map(item => item.expansion_mrr),
          itemStyle: {
            color: '#60a5fa', // blue-400 (lighter blue)
          },
        },
        {
          name: 'Reactivation',
          type: 'bar',
          stack: 'total',
          barWidth: 'auto',
          barGap: '0%',
          barCategoryGap: '0%',
          emphasis: {
            focus: 'series',
          },
          data: data.map(item => item.reactivation_mrr),
          itemStyle: {
            color: '#93c5fd', // blue-300 (lightest blue)
          },
        },
      ],
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
    <Card className="h-[320px]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          MRR Movements - Stacked Bar Chart
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div 
          ref={chartRef} 
          style={{ width: '100%', height: '250px' }}
        />
      </CardContent>
    </Card>
  )
}
