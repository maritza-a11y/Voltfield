import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Zap, LayoutDashboard, Briefcase, Map, FolderOpen, Settings, Menu, X,
} from 'lucide-react'
import NotificationBell from './NotificationBell'

const NAV = [
  { to: '/',         label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/jobs',     label: 'Jobs',      icon: Briefcase },
  { to: '/map',      label: 'Map',       icon: Map },
  { to: '/documents',label: 'Documents', icon: FolderOpen },
  { to: '/settings', label: 'Settings',  icon: Settings },
]

function NavItem({ to, label, icon: Icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition
        ${isActive
          ? 'bg-brand-accent text-white shadow-sm'
          : 'text-navy-300 hover:bg-navy-800 hover:text-white'}`
      }
    >
      <Icon className="h-4.5 w-4.5 h-[18px] w-[18px] shrink-0" />
      {label}
    </NavLink>
  )
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-navy-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-navy-900 lg:flex">
        <Brand />
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((n) => <NavItem key={n.to} {...n} />)}
        </nav>
        <div className="border-t border-navy-800 px-4 py-4">
          <p className="text-xs font-semibold text-navy-500">EVIDAC Electrical</p>
          <p className="text-xs text-navy-600">voltfield.app</p>
        </div>
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex-col bg-navy-900 transition-transform duration-200 lg:hidden
          ${mobileOpen ? 'flex translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <BrandInline />
          <button onClick={() => setMobileOpen(false)} className="text-navy-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map((n) => <NavItem key={n.to} {...n} onClick={() => setMobileOpen(false)} />)}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-navy-100 bg-white px-4 shadow-sm">
          <button className="lg:hidden text-navy-600 hover:text-navy-900" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 lg:hidden">
            <BrandInline dark />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent shadow">
        <Zap className="h-5 w-5 text-white" fill="currentColor" />
      </span>
      <div>
        <p className="text-base font-bold leading-none text-white">
          Volt<span className="text-brand-accent">Field</span>
        </p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-navy-500">
          EVIDAC
        </p>
      </div>
    </div>
  )
}

function BrandInline({ dark }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-accent">
        <Zap className="h-4 w-4 text-white" fill="currentColor" />
      </span>
      <span className={`text-sm font-bold ${dark ? 'text-navy-900' : 'text-white'}`}>
        Volt<span className="text-brand-accent">Field</span>
      </span>
    </div>
  )
}
