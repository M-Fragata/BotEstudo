import { Link } from 'react-router-dom'
import { Icon } from './Icon'

interface LogoProps {
  to?: string
  dark?: boolean
}

export function Logo({ to = '/', dark = false }: LogoProps) {
  return (
    <Link to={to} className={`flex items-center gap-2 ${dark ? 'text-white' : 'text-primary'}`}>
      <span className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-[0_6px_16px_rgba(0,82,255,0.3)]">
        <Icon name="school" filled className="text-sm md:text-base" />
      </span>
      {dark ? null : (
        <span className="font-display font-extrabold text-headline-md tracking-tight">
          Lumina Learn
        </span>
      )}
    </Link>
  )
}