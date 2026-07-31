import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tractor, ChevronRight, ChevronLeft, Check, MapPin, Users, Sliders } from 'lucide-react'
import { FARM_TYPES, ROLES, UNITS } from '../data/farmTypes'
import { Button, Input, Select, Alert } from '../components/ui'
import useFarmStore from '../store'
import { generateId, nowISO } from '../utils/helpers'
import { classNames } from '../utils/helpers'

const STEPS = [
  { id: 'welcome', title: 'Welcome', subtitle: 'Set up your farm management system' },
  { id: 'farm_type', title: 'Farm Type', subtitle: 'What kind of farm do you operate?' },
  { id: 'farm_profile', title: 'Farm Profile', subtitle: 'Tell us about your farm' },
  { id: 'modules', title: 'Modules', subtitle: 'Customize which features you need' },
  { id: 'team', title: 'Your Account', subtitle: 'Create your account to get started' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const completeOnboarding = useFarmStore((s) => s.completeOnboarding)

  const [step, setStep] = useState(0)
  const [selectedTypes, setSelectedTypes] = useState([])
  const [profile, setProfile] = useState({ name: '', location: '', area: '', areaUnit: 'Acres', currency: 'USD', latitude: '', longitude: '' })
  const [modules, setModules] = useState({ fields: true, livestock: true, inventory: true, tasks: true, finance: true, equipment: true, reports: true, weather: true })
  const [user, setUser] = useState({ name: '', role: 'owner', email: '', pin: '' })
  const [error, setError] = useState('')

  // Compute auto-modules from selected types
  const autoModules = selectedTypes.reduce((acc, typeId) => {
    const ft = FARM_TYPES.find((t) => t.id === typeId)
    if (!ft) return acc
    Object.entries(ft.modules).forEach(([k, v]) => { if (v) acc[k] = true })
    return acc
  }, {})

  const toggleType = (id) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const toggleModule = (key) => {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const canNext = () => {
    if (step === 1) return selectedTypes.length > 0
    if (step === 2) return profile.name.trim()
    if (step === 4) return user.name.trim()
    return true
  }

  const handleNext = () => {
    setError('')
    if (step === 1) {
      // Apply auto-modules from farm types
      const combined = { ...modules, ...autoModules }
      setModules(combined)
    }
    if (step === STEPS.length - 1) {
      handleFinish()
      return
    }
    setStep((s) => s + 1)
  }

  const handleFinish = () => {
    if (!user.name.trim()) {
      setError('Please enter your name')
      return
    }

    const farmType = selectedTypes.map((id) => FARM_TYPES.find((t) => t.id === id)?.name).filter(Boolean).join(', ')
    const firstUser = {
      id: generateId(),
      name: user.name,
      email: user.email,
      role: user.role,
      pin: user.pin,
      createdAt: nowISO(),
    }

    completeOnboarding(
      {
        ...profile,
        type: farmType,
        farmTypeIds: selectedTypes,
        latitude: parseFloat(profile.latitude) || 40.7128,
        longitude: parseFloat(profile.longitude) || -74.0060,
      },
      { ...modules, reports: true, weather: true },
      firstUser
    )
    navigate('/dashboard')
  }

  const progress = ((step) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="bg-emerald-600 rounded-2xl p-3">
            <Tractor size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">FarmManager</h1>
            <p className="text-emerald-400 text-sm">Your complete farm solution</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100">
            <div
              className="h-full bg-emerald-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1">
                    <div className={classNames(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                      i < step ? 'bg-emerald-600 text-white' :
                      i === step ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600' :
                      'bg-slate-100 text-slate-400'
                    )}>
                      {i < step ? <Check size={14} /> : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={classNames('w-6 h-0.5', i < step ? 'bg-emerald-600' : 'bg-slate-200')} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-4">{STEPS[step].title}</h2>
            <p className="text-sm text-slate-500">{STEPS[step].subtitle}</p>
          </div>

          {/* Step content */}
          <div className="px-8 py-7 min-h-[340px]">
            {error && <Alert variant="error" className="mb-4">{error}</Alert>}

            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center py-6">
                <div className="text-6xl mb-6">🌾</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Welcome to FarmManager</h3>
                <p className="text-slate-600 max-w-md mx-auto mb-6">
                  A complete farm management system that adapts to your specific farm type. We'll guide you through a quick setup to personalize your experience.
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[['📋', 'Plan tasks', 'Assign and track daily work'], ['📊', 'Track finances', 'Income, expenses & reports'], ['📦', 'Manage inventory', 'Stock levels & alerts']].map(([icon, title, desc]) => (
                    <div key={title} className="bg-slate-50 rounded-xl p-4">
                      <div className="text-2xl mb-2">{icon}</div>
                      <p className="font-semibold text-slate-800 text-sm">{title}</p>
                      <p className="text-xs text-slate-500 mt-1">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Farm Type */}
            {step === 1 && (
              <div>
                <p className="text-sm text-slate-500 mb-4">Select all that apply — you can enable multiple types for a mixed farm.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {FARM_TYPES.map((ft) => (
                    <button
                      key={ft.id}
                      onClick={() => toggleType(ft.id)}
                      className={classNames(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                        selectedTypes.includes(ft.id)
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      )}
                    >
                      <span className="text-2xl">{ft.emoji}</span>
                      <span className="text-sm font-semibold">{ft.name}</span>
                      <span className="text-xs text-slate-400 leading-tight">{ft.description}</span>
                      {selectedTypes.includes(ft.id) && (
                        <div className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <Check size={12} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Farm Profile */}
            {step === 2 && (
              <div className="grid gap-4">
                <Input
                  label="Farm Name *"
                  placeholder="e.g. Green Valley Farm"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                />
                <Input
                  label="Location / Address"
                  placeholder="e.g. Springfield, IL"
                  value={profile.location}
                  onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Latitude (for weather)"
                    placeholder="40.7128"
                    type="number"
                    value={profile.latitude}
                    onChange={(e) => setProfile((p) => ({ ...p, latitude: e.target.value }))}
                  />
                  <Input
                    label="Longitude (for weather)"
                    placeholder="-74.0060"
                    type="number"
                    value={profile.longitude}
                    onChange={(e) => setProfile((p) => ({ ...p, longitude: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Total Farm Area"
                    placeholder="e.g. 250"
                    type="number"
                    value={profile.area}
                    onChange={(e) => setProfile((p) => ({ ...p, area: e.target.value }))}
                  />
                  <Select
                    label="Area Unit"
                    value={profile.areaUnit}
                    onChange={(e) => setProfile((p) => ({ ...p, areaUnit: e.target.value }))}
                  >
                    {UNITS.area.map((u) => <option key={u}>{u}</option>)}
                  </Select>
                </div>
                <Select
                  label="Currency"
                  value={profile.currency}
                  onChange={(e) => setProfile((p) => ({ ...p, currency: e.target.value }))}
                >
                  {UNITS.currency.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </div>
            )}

            {/* Step 3: Modules */}
            {step === 3 && (
              <div>
                <p className="text-sm text-slate-500 mb-4">
                  Based on your farm type, we've pre-selected the modules you need. You can adjust these anytime in Settings.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'fields', label: 'Fields & Crops', emoji: '🌾', desc: 'Manage fields, planting, and harvest' },
                    { key: 'livestock', label: 'Livestock', emoji: '🐄', desc: 'Animals, health, and production' },
                    { key: 'inventory', label: 'Inventory', emoji: '📦', desc: 'Stock levels and supplies' },
                    { key: 'tasks', label: 'Tasks', emoji: '✅', desc: 'Assign and track work' },
                    { key: 'finance', label: 'Finance', emoji: '💰', desc: 'Income, expenses, reports' },
                    { key: 'equipment', label: 'Equipment', emoji: '🚜', desc: 'Machinery and maintenance' },
                  ].map(({ key, label, emoji, desc }) => (
                    <button
                      key={key}
                      onClick={() => toggleModule(key)}
                      className={classNames(
                        'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                        modules[key]
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-slate-200 bg-white opacity-60'
                      )}
                    >
                      <span className="text-xl">{emoji}</span>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                      <div className={classNames(
                        'ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                        modules[key] ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                      )}>
                        {modules[key] && <Check size={12} className="text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Account */}
            {step === 4 && (
              <div className="grid gap-4">
                <Input
                  label="Your Name *"
                  placeholder="e.g. John Smith"
                  value={user.name}
                  onChange={(e) => setUser((u) => ({ ...u, name: e.target.value }))}
                />
                <Input
                  label="Email (optional)"
                  type="email"
                  placeholder="john@example.com"
                  value={user.email}
                  onChange={(e) => setUser((u) => ({ ...u, email: e.target.value }))}
                />
                <Select
                  label="Role"
                  value={user.role}
                  onChange={(e) => setUser((u) => ({ ...u, role: e.target.value }))}
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Select>
                <Input
                  label="PIN (4 digits, optional)"
                  type="password"
                  placeholder="Set a 4-digit PIN for quick login"
                  maxLength={4}
                  value={user.pin}
                  onChange={(e) => setUser((u) => ({ ...u, pin: e.target.value.replace(/\D/, '') }))}
                />
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-emerald-800 mb-1">🎉 Almost done!</p>
                  <p className="text-xs text-emerald-700">
                    You're setting up <strong>{profile.name || 'your farm'}</strong> as a{' '}
                    <strong>{selectedTypes.map((id) => FARM_TYPES.find((t) => t.id === id)?.name).join(' / ')}</strong> farm.
                    Click Finish to launch your personalized dashboard.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ChevronLeft size={16} />
              Back
            </Button>
            <Button onClick={handleNext} disabled={!canNext()} size="lg">
              {step === STEPS.length - 1 ? 'Finish Setup' : 'Continue'}
              {step < STEPS.length - 1 && <ChevronRight size={16} />}
            </Button>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-4">
          You can change all settings later from the Settings page.
        </p>
      </div>
    </div>
  )
}
