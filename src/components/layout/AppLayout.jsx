import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar, { MobileMenuButton } from './Sidebar'
import useFarmStore from '../../store'
import { Bell } from 'lucide-react'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { farmProfile } = useFarmStore()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30">
          <MobileMenuButton onClick={() => setMobileOpen(true)} />
          <span className="font-semibold text-slate-900 flex-1">{farmProfile?.name || 'Farm Management'}</span>
          <Bell size={20} className="text-slate-500" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
