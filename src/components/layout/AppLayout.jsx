import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar, { MobileMenuButton } from './Sidebar'
import useFarmStore from '../../store'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { farmProfile } = useFarmStore()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
          <MobileMenuButton onClick={() => setMobileOpen(true)} />
          <span className="font-semibold text-slate-900 flex-1 text-sm">{farmProfile?.name || 'Farm Management'}</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 lg:p-7 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
