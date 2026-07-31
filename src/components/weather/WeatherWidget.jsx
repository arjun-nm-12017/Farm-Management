import { useState, useEffect } from 'react'
import { Wind, Droplets, MapPin } from 'lucide-react'
import { Card } from '../ui'
import { WEATHER_CODES } from '../../utils/helpers'
import useFarmStore from '../../store'

export default function WeatherWidget({ compact = false }) {
  const { farmProfile } = useFarmStore()
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const lat = farmProfile?.latitude || 40.7128
    const lon = farmProfile?.longitude || -74.0060

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
    )
      .then((r) => r.json())
      .then((data) => { setWeather(data); setLoading(false) })
      .catch(() => { setError('Weather unavailable'); setLoading(false) })
  }, [farmProfile?.latitude, farmProfile?.longitude])

  if (loading) {
    return (
      <Card className={compact ? 'py-3' : ''}>
        <div className="animate-pulse h-16 bg-slate-100 rounded-lg" />
      </Card>
    )
  }

  if (error || !weather) {
    return (
      <Card>
        <p className="text-sm text-slate-400 text-center py-4">{error}</p>
      </Card>
    )
  }

  const current = weather.current
  const daily = weather.daily
  const code = current.weather_code
  const wInfo = WEATHER_CODES[code] || { icon: '🌡️', label: 'Unknown' }

  if (compact) {
    return (
      <Card padding={false} className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{wInfo.icon}</span>
          <div>
            <p className="text-xl font-bold text-slate-900">{Math.round(current.temperature_2m)}°C</p>
            <p className="text-xs text-slate-500">{wInfo.label}</p>
          </div>
          <div className="ml-auto flex flex-col gap-1 text-right">
            <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
              <Wind size={12} /> {Math.round(current.wind_speed_10m)} km/h
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
              <Droplets size={12} /> {current.relative_humidity_2m}%
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={14} className="text-slate-400" />
        <p className="text-sm font-medium text-slate-600">{farmProfile?.location || 'Farm Location'}</p>
      </div>

      {/* Current */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-5xl">{wInfo.icon}</span>
        <div>
          <p className="text-4xl font-bold text-slate-900">{Math.round(current.temperature_2m)}°C</p>
          <p className="text-sm text-slate-500">{wInfo.label}</p>
        </div>
        <div className="ml-auto flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Wind size={14} className="text-slate-400" />
            {Math.round(current.wind_speed_10m)} km/h
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Droplets size={14} className="text-slate-400" />
            {current.relative_humidity_2m}%
          </div>
        </div>
      </div>

      {/* 7-day forecast */}
      <div className="grid grid-cols-7 gap-1">
        {daily.time.slice(0, 7).map((date, i) => {
          const dayCode = daily.weather_code[i]
          const dayInfo = WEATHER_CODES[dayCode] || { icon: '🌡️' }
          const dayName = i === 0 ? 'Today' : new Date(date).toLocaleDateString('en', { weekday: 'short' })
          return (
            <div key={date} className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-slate-50 transition-colors">
              <p className="text-xs font-medium text-slate-500">{dayName}</p>
              <span className="text-lg">{dayInfo.icon}</span>
              <p className="text-xs font-semibold text-slate-900">{Math.round(daily.temperature_2m_max[i])}°</p>
              <p className="text-xs text-slate-400">{Math.round(daily.temperature_2m_min[i])}°</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
