import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrCohortsChartProps, ArrCohortsEntry } from '../../types/dashboardData'

export function ArrCohortsChart({ data }: ArrCohortsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // Calculate current total ARR across all cohorts
  const currentCohort2020 = data.cohort2020[data.cohort2020.length - 1]
  const currentCohort2021 = data.cohort2021[data.cohort2021.length - 1]
  const currentCohort2022 = data.cohort2022[data.cohort2022.length - 1]
  const currentCohort2023 = data.cohort2023[data.cohort2023.length - 1]
  const currentCohort2024 = data.cohort2024[data.cohort2024.length - 1]
  
  const currentTotalArr = (currentCohort2020?.value_in_usd || 0) + 
                         (currentCohort2021?.value_in_usd || 0) + 
                         (currentCohort2022?.value_in_usd || 0) +
                         (currentCohort2023?.value_in_usd || 0) +
                         (currentCohort2024?.value_in_usd || 0)

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return `$${value.toLocaleString()}`
  }

  useEffect(() => {
    if (!chartRef.current) return

    // Initialize or update chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    // Prepare data for ECharts
    const dates = data.cohort2020.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    })

    const cohort2020Values = data.cohort2020.map(item => item.value_in_usd)
    const cohort2021Values = data.cohort2021.map(item => item.value_in_usd)
    const cohort2022Values = data.cohort2022.map(item => item.value_in_usd)
    const cohort2023Values = data.cohort2023.map(item => item.value_in_usd)
    const cohort2024Values = data.cohort2024.map(item => item.value_in_usd)

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
          const originalDate = data.cohort2020[params[0].dataIndex].date
          const date = new Date(originalDate)
          const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          
          let tooltip = `<div style="font-weight: bold;">${monthYear}</div>`
          
          params.forEach((param: any) => {
            if (param.value > 0) {
              const formattedValue = formatCurrency(param.value)
              
              // Add percentage change if available
              let changeText = ''
              let cohortData: ArrCohortsEntry[]
              
              switch(param.seriesName) {
                case '2020 Cohort':
                  cohortData = data.cohort2020
                  break
                case '2021 Cohort':
                  cohortData = data.cohort2021
                  break
                case '2022 Cohort':
                  cohortData = data.cohort2022
                  break
                case '2023 Cohort':
                  cohortData = data.cohort2023
                  break
                case '2024 Cohort':
                  cohortData = data.cohort2024
                  break
                default:
                  cohortData = data.cohort2020
              }
              
              const entry = cohortData[params[0].dataIndex]
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
      legend: {
        data: ['2020 Cohort', '2021 Cohort', '2022 Cohort', '2023 Cohort', '2024 Cohort'],
        top: 0,
        textStyle: {
          fontSize: 12,
        },
      },
      grid: {
        left: '0%',
        right: '0%',
        bottom: '0%',
        top: '15%',
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
          name: '2020 Cohort',
          type: 'line',
          data: cohort2020Values,
          smooth: false,
          lineStyle: {
            color: '#ef4444',
            width: 2
          },
          itemStyle: {
            color: '#ef4444'
          },
        },
        {
          name: '2021 Cohort',
          type: 'line',
          data: cohort2021Values,
          smooth: false,
          lineStyle: {
            color: '#f97316',
            width: 2
          },
          itemStyle: {
            color: '#f97316'
          },
        },
        {
          name: '2022 Cohort',
          type: 'line',
          data: cohort2022Values,
          smooth: false,
          lineStyle: {
            color: '#eab308',
            width: 2
          },
          itemStyle: {
            color: '#eab308'
          },
        },
        {
          name: '2023 Cohort',
          type: 'line',
          data: cohort2023Values,
          smooth: false,
          lineStyle: {
            color: '#22c55e',
            width: 3
          },
          itemStyle: {
            color: '#22c55e'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(34, 197, 94, 0.3)'
              }, {
                offset: 1, color: 'rgba(34, 197, 94, 0.05)'
              }]
            }
          }
        },
        {
          name: '2024 Cohort',
          type: 'line',
          data: cohort2024Values,
          smooth: false,
          lineStyle: {
            color: '#8b5cf6',
            width: 3
          },
          itemStyle: {
            color: '#8b5cf6'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(139, 92, 246, 0.3)'
              }, {
                offset: 1, color: 'rgba(139, 92, 246, 0.05)'
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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          ARR Cohorts
        </CardTitle>
        <div className="flex items-center">
          <div className="text-2xl font-bold">{formatCurrency(currentTotalArr)}</div>
        </div>
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
