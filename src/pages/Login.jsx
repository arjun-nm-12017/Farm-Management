import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tractor, ChevronRight } from 'lucide-react'
import { Button, Input, Alert } from '../components/ui'
import useFarmStore from '../store'

export default function Login() {
  const navigate = useNavigate()
  const { users, login, farmProfile } = useFarmStore()
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    setError('')
    const user = users.find((u) => u.id === selected)
    if (!user) { setError('Please select a user'); return }
    if (user.pin && user.pin !== pin) { setError('Incorrect PIN'); return }
    login(user.id)
    navigate('/dashboard')
  }

  const selectedUser = users.find((u) => u.id === selected)

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: 'linear-gradient(160deg, #064e3b 0%, #0f172a 60%, #1e3a5f 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 rounded-xl p-2.5 shadow-lg shadow-emerald-900/50">
            <Tractor size={20} className="text-white" />
          </div>
          <span className="text-white font-semibold text-lg">FarmManager</span>
        </div>
        <div>
          <p className="text-5xl font-bold text-white leading-tight mb-4">
            Welcome<br />back 👋
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            {farmProfile?.name
              ? `Manage ${farmProfile.name} — track crops, livestock, tasks, and finances all in one place.`
              : 'Your complete farm management system.'}
          </p>
        </div>
        <p className="text-slate-600 text-xs">© 2026 FarmManager</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="bg-emerald-600 rounded-xl p-2.5">
              <Tractor size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900">FarmManager</p>
              <p className="text-xs text-slate-500">{farmProfile?.name}</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-7">Select your account to continue</p>

          {error && <Alert variant="error" className="mb-5">{error}</Alert>}

          <div className="space-y-2.5 mb-5">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => { setSelected(user.id); setPin('') }}
                className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all duration-150 text-left ${
                  selected === user.id
                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                  selected === user.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                  <p className="text-xs text-slate-400 capitalize mt-0.5">{user.role}</p>
                </div>
                {selected === user.id && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <svg width="10" height="10" fill="none" stroke="white" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {selected && selectedUser?.pin && (
            <Input
              label="PIN"
              type="password"
              maxLength={4}
              placeholder="Enter your 4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/, ''))}
              className="mb-5"
            />
          )}

          <Button className="w-full" size="lg" onClick={handleLogin} disabled={!selected}>
            Continue to Dashboard
            <ChevronRight size={16} />
          </Button>

        </div>
      </div>
    </div>
  )
}
