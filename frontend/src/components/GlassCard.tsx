import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  interactive?: boolean
}

export function GlassCard({ children, className = '', interactive = false }: GlassCardProps) {
  return (
    <div
      className={`glass-card rounded-2xl border border-outline-variant/30 ${
        interactive ? 'glass-card-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}