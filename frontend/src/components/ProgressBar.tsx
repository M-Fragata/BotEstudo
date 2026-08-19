interface ProgressBarProps {
  value: number
  className?: string
}

export function ProgressBar({ value, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full bg-surface-variant rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="bg-primary h-2 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,82,255,0.5)]"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}