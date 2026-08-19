import { NavLink, Link, useLocation } from 'react-router-dom'
import { Icon } from './Icon'
import { Logo } from './Logo'

interface NavItem {
  label: string
  path: string
  icon: string
}

const navItems: NavItem[] = [
  { label: 'Home', path: '/', icon: 'dashboard' },
  { label: 'Subjects', path: '/', icon: 'menu_book' },
  { label: 'Practice', path: '/gerar', icon: 'quiz' },
]

export function TopBar() {
  const location = useLocation()
  const transactional = location.pathname === '/simulado' || location.pathname === '/resultado'

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-card">
      <div className="max-w-[1280px] mx-auto flex justify-between items-center px-container-padding-mobile md:px-container-padding-desktop py-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-gutter">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `font-label-bold text-label-bold transition-all duration-300 hover:scale-105 ${
                  isActive ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={`flex gap-stack-md text-primary ${transactional ? 'hidden md:flex' : ''}`}>
          <Link to="/perfil" className="flex items-center">
            <span className="material-symbols-outlined hover:scale-105 transition-transform duration-200 cursor-pointer">
              account_circle
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}

export function MobileNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-bar rounded-t-xl flex justify-around items-center py-stack-sm px-margin-mobile">
      {navItems.map((item) => (
        <Link
          key={item.label}
          to={item.path}
          className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-200 active:scale-90 ${
            item.path === location.pathname
              ? 'bg-primary-container text-on-primary-container rounded-full'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <Icon name={item.icon} filled={item.path === location.pathname} className="mb-1" />
          <span className="font-caption text-caption">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}