import { useState, useEffect } from 'react'
import { Wind, Droplets, MapPin, Thermometer } from 'lucide-react'
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
    const lon = farmProfile?.longitude || -74.006
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
    )
      .then((r) => r.json())
      .then((d) => { setWeather(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [farmProfile?.latitude, farmProfile?.longitude])

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-100 rounded-lg w-1/3" />
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="grid grid-cols-7 gap-1">
            {[...Array(7)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-lg" />)}
          </div>
        </div>
      </Card>
    )
  }

  if (error || !weather) {
    return (
      <Card>
        <div className="flex flex-col items-center py-6 text-center">
          <Thermometer size={24} className="text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">Weather unavailable</p>
        </div>
      </Card>
    )
  }

  const current = weather.current
  const daily = weather.daily
  const wInfo = WEATHER_CODES[current.weather_code] || { icon: '🌡️', label: 'Unknown' }

  if (compact) {
    return (
      <Card>
        <div className="flex items-center gap-4">
          <span className="text-4xl leading-none">{wInfo.icon}</span>
          <div className="flex-1">
            <p className="text-2xl font-bold text-slate-900">{Math.round(current.temperature_2m)}°C</p>
            <p className="text-xs text-slate-500 mt-0.5">{wInfo.label}</p>
          </div>
          <div className="flex flex-col gap-1.5 text-right">
            <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
              <Wind size={11} className="text-slate-400" /> {Math.round(current.wind_speed_10m)} km/h
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
              <Droplets size={11} className="text-slate-400" /> {current.relative_humidity_2m}%
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      {farmProfile?.location && (
        <div className="flex items-center gap-1.5 mb-4">
          <MapPin size={12} className="text-slate-400" />
          <p className="text-xs font-medium text-slate-500">{farmProfile.location}</p>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <span className="text-5xl leading-none">{wInfo.icon}</span>
        <div className="flex-1">
          <p className="text-4xl font-bold text-slate-900 tracking-tight">{Math.round(current.temperature_2m)}°C</p>
          <p className="text-sm text-slate-500 mt-0.5">{wInfo.label}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Wind size={14} className="text-slate-400" /> {Math.round(current.wind_speed_10m)} km/h
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Droplets size={14} className="text-slate-400" /> {current.relative_humidity_2m}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daily.time.slice(0, 7).map((date, i) => {
          const dInfo = WEATHER_CODES[daily.weather_code[i]] || { icon: '🌡️' }
          const dayName = i === 0 ? 'Today' : new Date(date).toLocaleDateString('en', { weekday: 'short' })
          return (
            <div key={date} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <p className="text-xs font-medium text-slate-400">{dayName}</p>
              <span className="text-lg leading-none">{dInfo.icon}</span>
              <p className="text-xs font-bold text-slate-900">{Math.round(daily.temperature_2m_max[i])}°</p>
              <p className="text-xs text-slate-400">{Math.round(daily.temperature_2m_min[i])}°</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
