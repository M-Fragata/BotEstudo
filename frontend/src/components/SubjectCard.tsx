import type { Subject } from '../types'

interface SubjectCardProps {
  subject: Subject
}

export function SubjectCard({ subject }: SubjectCardProps) {
  return (
    <a
      href={`/disciplina/${subject.id}`}
      className="block rounded-2xl transition-all duration-200 hover:scale-[1.01]"
    >
      <div className="glass-card glass-card-hover rounded-2xl p-stack-md border border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-stack-md">
          <div>
            <h3 className="font-body-md text-body-md font-semibold text-on-surface">
              {subject.name}
            </h3>
            <div className="font-caption text-caption text-on-surface-variant flex items-center gap-1">
              Conclusão: {subject.retention}%
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}