import type { IconName } from '../types/icons'
import { Icon } from './Icon'

interface StatCardProps {
  icon: IconName
  value: string
  label: string
  tone: 'secondary' | 'tertiary'
}

export function StatCard({ icon, value, label, tone }: StatCardProps) {
  return (
    <div className="flex-1 bg-surface-variant/50 rounded-xl p-stack-sm flex items-center gap-stack-sm">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          tone === 'secondary'
            ? 'bg-secondary-container text-on-secondary-container'
            : 'bg-tertiary-container text-on-tertiary-container'
        }`}
      >
        <Icon name={icon} style={{ fontSize: 18 }} />
      </div>
      <div>
        <div className="font-body-md text-body-md font-semibold text-on-surface">{value}</div>
        <div className="font-caption text-caption text-on-surface-variant">{label}</div>
      </div>
    </div>
  )
}