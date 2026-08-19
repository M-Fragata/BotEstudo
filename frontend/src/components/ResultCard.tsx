import type { ResultItem } from '../types'
import { GlassCard } from './GlassCard'
import { StatusChip } from './Chip'

export function ResultCard({ item }: { item: ResultItem }) {
  return (
    <GlassCard
      interactive
      className={`p-stack-md flex flex-col gap-stack-sm border-l-4 ${
        item.correct ? 'border-l-tertiary-fixed' : 'border-l-error'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="font-label-bold text-label-bold text-outline">
          Questão {item.questionNumber}
        </span>
        <StatusChip
          correct={item.correct}
          answered={item.userAnswer}
          correctAnswer={item.correctAnswer}
        />
      </div>
      <p className="font-body-md text-body-md text-on-surface line-clamp-2">{item.prompt}</p>
      <div className="mt-xs pt-xs border-t border-outline-variant flex flex-col gap-xs">
        <div className="flex justify-between items-center gap-4">
          <span className="font-caption text-caption text-outline">Sua resposta:</span>
          <span
            className={`font-body-md text-sm ${item.correct ? 'text-on-surface' : 'text-error line-through'}`}
          >
            {item.userAnswer}
          </span>
        </div>
        {item.correctAnswer && !item.correct ? (
          <div className="flex justify-between items-center gap-4">
            <span className="font-caption text-caption text-outline">Correta:</span>
            <span className="font-body-md text-sm text-primary">{item.correctAnswer}</span>
          </div>
        ) : null}
      </div>
    </GlassCard>
  )
}