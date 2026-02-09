import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Configurator' },
  { to: '/projects', label: 'Timeline' },
  { to: '/like-that', label: 'Like That' },
] as const

export default function AppNav() {
  const location = useLocation()

  return (
    <nav className="flex items-center gap-1 border-b border-white/10 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-3 flex items-center gap-4">
        {NAV_LINKS.map(({ to, label }) => {
          const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-lg text-sm tracking-tighter transition-colors ${
                isActive
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
