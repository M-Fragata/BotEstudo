import type { Subject } from '../types'
import { Icon } from './Icon'
import { Button } from './Button'

const tones = {
  primary: {
    icon: 'bg-primary-container text-primary',
    button: 'outline' as const,
    label: 'Praticar',
  },
  secondary: {
    icon: 'bg-secondary-container text-on-secondary-container',
    button: 'primary' as const,
    label: 'Revisar',
  },
  tertiary: {
    icon: 'bg-tertiary-container text-on-tertiary-container',
    button: 'outline' as const,
    label: 'Praticar',
  },
}

const trendIcon = {
  up: 'trending_up',
  down: 'trending_down',
  flat: 'trending_flat',
} as const

interface SubjectCardProps {
  subject: Subject
  onAction: (subject: Subject) => void
}

export function SubjectCard({ subject, onAction }: SubjectCardProps) {
  const tone = tones[subject.tone]

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-stack-md border border-outline-variant/30 flex items-center justify-between">
      <div className="flex items-center gap-stack-md">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tone.icon}`}>
          <Icon name={subject.icon as 'calculate'} />
        </div>
        <div>
          <h3 className="font-body-md text-body-md font-semibold text-on-surface">
            {subject.name}
          </h3>
          <div className="font-caption text-caption text-on-surface-variant flex items-center gap-1">
            <Icon
              name={trendIcon[subject.trend]}
              className={subject.trend === 'down' ? 'text-error' : ''}
              style={{ fontSize: 14 }}
              aria-hidden
            />
            Retenção: {subject.retention}%
          </div>
        </div>
      </div>
      <Button variant={tone.button} onClick={() => onAction(subject)}>
        {tone.label}
      </Button>
    </div>
  )
}