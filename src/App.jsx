import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useFarmStore from './store'
import AppLayout from './components/layout/AppLayout'
import Onboarding from './pages/Onboarding'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Fields from './pages/Fields'
import Livestock from './pages/Livestock'
import Inventory from './pages/Inventory'
import Tasks from './pages/Tasks'
import Finance from './pages/Finance'
import Equipment from './pages/Equipment'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function RequireOnboarding({ children }) {
  const { onboardingComplete } = useFarmStore()
  if (!onboardingComplete) return <Navigate to="/" replace />
  return children
}

function RequireAuth({ children }) {
  const { onboardingComplete, currentUser } = useFarmStore()
  if (!onboardingComplete) return <Navigate to="/" replace />
  if (!currentUser) return <Navigate to="/login" replace />
  return children
}

function ModuleGuard({ module, children }) {
  const enabledModules = useFarmStore((s) => s.enabledModules)
  if (!enabledModules[module]) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { onboardingComplete, currentUser } = useFarmStore()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={
          onboardingComplete
            ? <Navigate to={currentUser ? '/dashboard' : '/login'} replace />
            : <Onboarding />
        } />
        <Route path="/login" element={
          !onboardingComplete ? <Navigate to="/" replace /> :
          currentUser ? <Navigate to="/dashboard" replace /> :
          <Login />
        } />

        {/* Protected app */}
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/fields" element={<ModuleGuard module="fields"><Fields /></ModuleGuard>} />
          <Route path="/livestock" element={<ModuleGuard module="livestock"><Livestock /></ModuleGuard>} />
          <Route path="/inventory" element={<ModuleGuard module="inventory"><Inventory /></ModuleGuard>} />
          <Route path="/tasks" element={<ModuleGuard module="tasks"><Tasks /></ModuleGuard>} />
          <Route path="/finance" element={<ModuleGuard module="finance"><Finance /></ModuleGuard>} />
          <Route path="/equipment" element={<ModuleGuard module="equipment"><Equipment /></ModuleGuard>} />
          <Route path="/reports" element={<ModuleGuard module="reports"><Reports /></ModuleGuard>} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
