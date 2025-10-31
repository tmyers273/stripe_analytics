import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NewBizReactivationChartProps } from '../../types/dashboardData'

export function NewBizReactivationChart({ data }: NewBizReactivationChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Initialize or update chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    // Prepare data for ECharts - filter for quarter-end dates
    const quarterData = data.filter(item => {
      const date = new Date(item.date)
      const month = date.getMonth() + 1
      return month === 3 || month === 6 || month === 9 || month === 12
    })

    const dates = quarterData.map(item => {
      const date = new Date(item.date)
      return `Q${Math.floor((date.getMonth() + 3) / 3)} ${date.getFullYear()}`
    })

    const newBizMrr = quarterData.map(item => item.new_biz_mrr)
    const expansionMrr = quarterData.map(item => item.expansion_mrr)
    const reactivationMrr = quarterData.map(item => item.reactivation_mrr)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          const dataIndex = params[0].dataIndex
          const originalDate = quarterData[dataIndex].date
          const date = new Date(originalDate)
          const quarter = `Q${Math.floor((date.getMonth() + 3) / 3)} ${date.getFullYear()}`
          
          let tooltip = `<div style="font-weight: bold;">${quarter}</div>`
          
          // Get previous quarter data for comparison
          const currentIndex = params[0].dataIndex
          const previousQuarterData = currentIndex > 0 ? quarterData[currentIndex - 1] : null
          
          let total = 0
          
          params.forEach((param: any) => {
            if (param.value !== 0) {
              const valueInDollars = param.value / 100
              const formattedValue = valueInDollars > 0 ? `+$${valueInDollars.toLocaleString()}` : `-$${Math.abs(valueInDollars).toLocaleString()}`
              
              // Calculate quarter-over-quarter percentage change
              let changeText = ''
              if (previousQuarterData) {
                const currentValue = param.value
                let previousValue = 0
                
                switch(param.seriesName) {
                  case 'New Business':
                    previousValue = previousQuarterData.new_biz_mrr
                    break
                  case 'Expansion':
                    previousValue = previousQuarterData.expansion_mrr
                    break
                  case 'Reactivation':
                    previousValue = previousQuarterData.reactivation_mrr
                    break
                }
                
                // Calculate percentage change
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
          
          // Convert total to dollars and calculate percentage change
          const totalInDollars = total / 100
          let netChangeText = ''
          
          if (previousQuarterData) {
            const previousTotal = previousQuarterData.net_movement_mrr
            
            // Calculate percentage change
            let netPercentChange = 0
            if (previousTotal !== 0) {
              netPercentChange = ((total - previousTotal) / Math.abs(previousTotal)) * 100
            } else if (total !== 0) {
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
          name: 'New Business',
          type: 'bar',
          stack: 'total',
          barWidth: 'auto',
          barGap: '0%',
          barCategoryGap: '0%',
          emphasis: {
            focus: 'series',
          },
          data: newBizMrr,
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
          data: expansionMrr,
          itemStyle: {
            color: '#60a5fa', // blue-400
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
          data: reactivationMrr,
          itemStyle: {
            color: '#93c5fd', // blue-300
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          New Biz + Reactivations - Quarterly Growth
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-2">
        <div 
          ref={chartRef} 
          className="w-full h-full"
        />
      </CardContent>
    </Card>
  )
}
