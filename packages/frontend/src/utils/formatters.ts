export const formatters = {
  currency: (value: number, showCents: boolean = false) => {
    if (showCents) {
      return `$${(value / 100).toLocaleString()}`
    }
    return `$${value.toLocaleString()}`
  },

  currencyCompact: (value: number, showCents: boolean = false) => {
    const valueInDollars = showCents ? value / 100 : value
    if (valueInDollars >= 1000000) {
      return `$${(valueInDollars / 1000000).toFixed(1)}M`
    }
    return `$${valueInDollars.toLocaleString()}`
  },

  number: (value: number) => {
    return value.toLocaleString()
  },

  percentage: (value: number, showSign: boolean = true) => {
    const sign = value > 0 && showSign ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  },

  monthYear: (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  },

  shortMonthYear: (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  },

  quarterYear: (dateString: string) => {
    const date = new Date(dateString)
    return `Q${Math.floor((date.getMonth() + 3) / 3)} ${date.getFullYear()}`
  }
}

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 999999 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

export const formatPercentageChange = (current: number, previous: number, showSign: boolean = true): string => {
  const change = calculatePercentageChange(current, previous)
  if (Math.abs(change) >= 999999) {
    return 'New'
  }
  return formatters.percentage(change, showSign)
}
