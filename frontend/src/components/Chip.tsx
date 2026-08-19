import type { ReactNode } from 'react'

interface ChipProps {
  icon?: string
  children: ReactNode
  tone?: 'primary' | 'secondary' | 'success' | 'error' | 'warning'
  className?: string
}

const tones = {
  primary: 'bg-primary-container/20 text-primary',
  secondary: 'bg-secondary-fixed text-on-secondary-fixed',
  success: 'bg-tertiary-fixed text-on-tertiary-fixed',
  error: 'bg-error text-on-error',
  warning: 'bg-secondary-container/20 text-[#B8860B]',
}

export function Chip({ icon, children, tone = 'primary', className = '' }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-label-bold text-label-bold ${tones[tone]} ${className}`}
    >
      {icon ? (
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1", fontSize: 14 }}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </span>
  )
}

export function StatusChip({
  correct,
  answered,
  correctAnswer,
}: {
  correct: boolean
  answered: string | null
  correctAnswer?: string
}) {
  if (correct) {
    return (
      <span className="inline-flex items-center gap-1 bg-tertiary-fixed text-on-tertiary-fixed px-2 py-1 rounded-md font-caption text-caption">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}
          aria-hidden="true"
        >
          check_circle
        </span>
        Correta
      </span>
    )
  }
  if (correctAnswer && answered !== null) {
    return (
      <span className="inline-flex items-center gap-1 bg-error text-on-error px-2 py-1 rounded-md font-caption text-caption">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}
          aria-hidden="true"
        >
          cancel
        </span>
        Incorreta
      </span>
    )
  }
  return null
}