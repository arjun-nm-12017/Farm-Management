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

  const handleLogout = () => navigate('/login')

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.module === null || enabledModules[item.module]
  )

  const content = (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>

      {/* Farm header */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 rounded-xl p-2.5 shrink-0 shadow-lg shadow-emerald-900/50">
            <Tractor size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white text-sm truncate leading-tight">
              {farmProfile?.name || 'My Farm'}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {farmProfile?.type || 'Farm Management'}
            </p>
          </div>
          {mobileOpen !== undefined && (
            <button
              onClick={onMobileClose}
              className="ml-auto text-slate-500 hover:text-slate-300 transition-colors lg:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/5 mb-3" />

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-widest">Menu</p>
        <ul className="space-y-0.5">
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  classNames(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={classNames(
                      'flex items-center justify-center w-7 h-7 rounded-lg transition-colors',
                      isActive ? 'bg-emerald-500/20' : ''
                    )}>
                      <Icon size={16} className="shrink-0" />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-4 pt-4 border-t border-white/5">
          <NavLink
            to="/settings"
            onClick={onMobileClose}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={classNames('flex items-center justify-center w-7 h-7 rounded-lg', isActive ? 'bg-emerald-500/20' : '')}>
                  <Settings size={16} className="shrink-0" />
                </span>
                Settings
              </>
            )}
          </NavLink>
        </div>
      </nav>

      {/* User footer */}
      <div className="mx-3 mb-4 mt-2">
        <div className="bg-white/5 rounded-xl px-3 py-3 flex items-center gap-3">
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl w-9 h-9 flex items-center justify-center text-sm font-bold text-emerald-400 shrink-0">
            {currentUser?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate leading-tight">{currentUser?.name || 'User'}</p>
            <p className="text-xs text-slate-500 capitalize mt-0.5">{currentUser?.role || 'owner'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-white/10"
            title="Logout"
          >
            <LogOut size={15} />
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="relative w-64 h-full flex flex-col z-10 shadow-2xl">
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
      className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
    >
      <Menu size={20} />
    </button>
  )
}
