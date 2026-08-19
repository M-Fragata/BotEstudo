import type { ReactNode } from 'react'
import type { IconName } from '../types/icons'

export type ButtonVariant = 'primary' | 'outline' | 'gradient' | 'ghost'

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  fullWidth?: boolean
  leadingIcon?: IconName
  trailingIcon?: IconName
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
  disabled?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 font-label-bold text-label-bold rounded-xl transition-all duration-200'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary shadow-glow hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(0,82,255,0.4)] active:scale-95',
  gradient:
    'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-glow hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(0,82,255,0.4)] active:scale-95',
  outline:
    'bg-transparent border-2 border-primary text-primary hover:scale-[1.02] hover:shadow-[0_4px_10px_rgba(0,82,255,0.1)] active:scale-95',
  ghost: 'bg-transparent text-primary hover:bg-primary/5 active:scale-95',
}

export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${
        disabled ? 'opacity-60 pointer-events-none' : ''
      } ${className}`}
    >
      {leadingIcon ? (
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1" }}
          aria-hidden="true"
        >
          {leadingIcon}
        </span>
      ) : null}
      <span>{children}</span>
      {trailingIcon ? (
        <span className="material-symbols-outlined" aria-hidden="true">
          {trailingIcon}
        </span>
      ) : null}
    </button>
  )
}