import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Wheat, Heart, Package, CheckSquare,
  DollarSign, Wrench, BarChart2, Settings, LogOut, Menu, X, Tractor
} from 'lucide-react'
import useFarmStore from '../../store'
import { classNames } from '../../utils/helpers'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', module: null },
  { to: '/fields', icon: Wheat, label: 'Fields & Crops', module: 'fields' },
  { to: '/livestock', icon: Heart, label: 'Livestock', module: 'livestock' },
  { to: '/inventory', icon: Package, label: 'Inventory', module: 'inventory' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', module: 'tasks' },
  { to: '/finance', icon: DollarSign, label: 'Finance', module: 'finance' },
  { to: '/equipment', icon: Wrench, label: 'Equipment', module: 'equipment' },
  { to: '/reports', icon: BarChart2, label: 'Reports', module: 'reports' },
]

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { farmProfile, enabledModules, currentUser } = useFarmStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/login')
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.module === null || enabledModules[item.module]
  )

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Farm header */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 rounded-xl p-2.5 shrink-0">
            <Tractor size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">
              {farmProfile?.name || 'My Farm'}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {farmProfile?.type || 'Farm Management'}
            </p>
          </div>
          {mobileOpen !== undefined && (
            <button
              onClick={onMobileClose}
              className="ml-auto text-slate-400 hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  classNames(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )
                }
              >
                <Icon size={18} className="shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <NavLink
            to="/settings"
            onClick={onMobileClose}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )
            }
          >
            <Settings size={18} className="shrink-0" />
            Settings
          </NavLink>
        </div>
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {currentUser?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentUser?.name || 'User'}</p>
            <p className="text-xs text-slate-400 capitalize">{currentUser?.role || 'owner'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="relative w-64 h-full flex flex-col z-10">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}

export function MobileMenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
    >
      <Menu size={20} />
    </button>
  )
}
