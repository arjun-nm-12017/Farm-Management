import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tractor, Lock } from 'lucide-react'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="bg-emerald-600 rounded-2xl p-3">
            <Tractor size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">FarmManager</h1>
            <p className="text-emerald-400 text-sm">{farmProfile?.name || 'Your farm'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-7">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={18} className="text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Who are you?</h2>
          </div>

          {error && <Alert variant="error" className="mb-4">{error}</Alert>}

          <div className="space-y-2 mb-5">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => { setSelected(user.id); setPin('') }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                  selected === user.id
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="bg-slate-200 rounded-full w-9 h-9 flex items-center justify-center font-bold text-slate-700">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{user.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                </div>
              </button>
            ))}
          </div>

          {selected && users.find((u) => u.id === selected)?.pin && (
            <Input
              label="PIN"
              type="password"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/, ''))}
              className="mb-4"
            />
          )}

          <Button className="w-full" size="lg" onClick={handleLogin} disabled={!selected}>
            Continue to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
