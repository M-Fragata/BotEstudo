import type { CSSProperties } from 'react'

interface IconProps {
  name: string
  filled?: boolean
  className?: string
  style?: CSSProperties
}

export function Icon({ name, filled = false, className = '', style }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}`, ...style }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}