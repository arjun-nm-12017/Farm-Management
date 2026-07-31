import { format, formatDistanceToNow, isAfter, isBefore, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns'

export const generateId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export const nowISO = () => new Date().toISOString()

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy HH:mm')
  } catch {
    return dateStr
  }
}

export const timeAgo = (dateStr) => {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

export const formatCurrency = (amount, currency = 'USD') => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export const formatNumber = (n, decimals = 0) => {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(n)
}

export const isOverdue = (dateStr) => {
  if (!dateStr) return false
  try {
    return isBefore(parseISO(dateStr), new Date())
  } catch {
    return false
  }
}

export const isUpcoming = (dateStr, days = 7) => {
  if (!dateStr) return false
  try {
    const date = parseISO(dateStr)
    const future = new Date()
    future.setDate(future.getDate() + days)
    return isAfter(date, new Date()) && isBefore(date, future)
  } catch {
    return false
  }
}

export const getDateRange = (range) => {
  const now = new Date()
  switch (range) {
    case 'this_month':
      return { from: startOfMonth(now).toISOString(), to: endOfMonth(now).toISOString() }
    case 'last_month': {
      const last = subMonths(now, 1)
      return { from: startOfMonth(last).toISOString(), to: endOfMonth(last).toISOString() }
    }
    case 'this_year':
      return { from: startOfYear(now).toISOString(), to: endOfYear(now).toISOString() }
    case 'last_6_months':
      return { from: subMonths(now, 6).toISOString(), to: now.toISOString() }
    default:
      return { from: startOfMonth(now).toISOString(), to: endOfMonth(now).toISOString() }
  }
}

export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})

export const sumBy = (arr, key) =>
  arr.reduce((sum, item) => sum + (Number(item[key]) || 0), 0)

export const sortBy = (arr, key, dir = 'asc') =>
  [...arr].sort((a, b) => {
    const av = a[key], bv = b[key]
    if (av < bv) return dir === 'asc' ? -1 : 1
    if (av > bv) return dir === 'asc' ? 1 : -1
    return 0
  })

export const searchFilter = (items, query, fields) => {
  if (!query) return items
  const q = query.toLowerCase()
  return items.filter((item) =>
    fields.some((field) => String(item[field] || '').toLowerCase().includes(q))
  )
}

export const WEATHER_CODES = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Icy fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy drizzle', icon: '🌧️' },
  61: { label: 'Light rain', icon: '🌧️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '❄️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  80: { label: 'Rain showers', icon: '🌦️' },
  81: { label: 'Rain showers', icon: '🌦️' },
  82: { label: 'Violent showers', icon: '⛈️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm w/ hail', icon: '⛈️' },
  99: { label: 'Thunderstorm w/ hail', icon: '⛈️' },
}

export const classNames = (...classes) => classes.filter(Boolean).join(' ')
