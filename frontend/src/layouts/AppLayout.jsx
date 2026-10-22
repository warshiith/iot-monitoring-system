import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLiveReadings } from '../hooks/useLiveReadings.js'
import ConnectionStatus from '../components/ConnectionStatus.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: GridIcon, end: true },
  { to: '/devices', label: 'Devices', icon: CpuIcon },
  { to: '/sensors', label: 'Sensors', icon: WaveIcon },
  { to: '/live', label: 'Live Monitoring', icon: PulseIcon },
  { to: '/history', label: 'Historical Data', icon: ClockIcon },
  { to: '/alerts', label: 'Alerts', icon: BellIcon },
  { to: '/settings', label: 'Settings', icon: UserIcon },
]

function GridIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
  )
}
function CpuIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}><rect x="5" y="5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 2v3M12 2v3M8 15v3M12 15v3M2 8h3M2 12h3M15 8h3M15 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )
}
function WaveIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}><path d="M2 10c1.5 0 1.5-4 3-4s1.5 4 3 4 1.5-4 3-4 1.5 4 3 4 1.5-4 3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
}
function PulseIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}><path d="M2 10h3l2-5 3 10 2-7 1.5 2H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
}
function ClockIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
}
function BellIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}><path d="M5 8a5 5 0 0110 0c0 3.5 1.2 4.5 1.2 4.5H3.8S5 11.5 5 8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 15.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )
}
function UserIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3.5 17c1-3.5 4-5 6.5-5s5.5 1.5 6.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )
}
function MenuIcon(props) {
  return <svg viewBox="0 0 20 20" fill="none" {...props}><path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { status } = useLiveReadings()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-graphite-700/60 bg-graphite-900/60 px-4 py-6">
        <SidebarContent />
      </aside>

      {/* Sidebar - mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-graphite-900 border-r border-graphite-700/60 px-4 py-6">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-graphite-700/60 flex items-center justify-between px-4 lg:px-8 bg-graphite-950/80 backdrop-blur sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-400 p-1" onClick={() => setMobileOpen(true)}>
              <MenuIcon className="w-6 h-6" />
            </button>
            <ConnectionStatus status={status} />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm text-slate-200">{user?.name}</span>
              <span className="text-xs text-slate-500 font-mono">{user?.role}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-graphite-800 border border-graphite-700 flex items-center justify-center text-xs font-mono text-signal">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-alert-high transition-colors">
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )

  function SidebarContent({ onNavigate }) {
    return (
      <>
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-signal/10 border border-signal/30 flex items-center justify-center">
            <span className="pulse-dot bg-signal text-signal" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-semibold text-slate-100 text-sm tracking-wide">PULSEGRID</div>
            <div className="text-[10px] text-slate-500 font-mono tracking-wider">IOT CONTROL</div>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-signal/10 text-signal border border-signal/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-graphite-800 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="text-[10px] text-slate-600 font-mono px-2 pt-4 border-t border-graphite-700/60">
          v1.0.0 · demo build
        </div>
      </>
    )
  }
}
