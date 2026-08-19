import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TopBar } from '../components/Nav'
import { Icon } from '../components/Icon'
import { Skeleton, SkeletonText } from '../components/Skeleton'
import { api } from '../api/client'
import type { QuestionDetail, StandaloneAnswerResult } from '../api/client'

const letters = ['A', 'B', 'C', 'D']

type OptionState = 'normal' | 'selected' | 'correct' | 'wrong' | 'dimmed'

function optionState(optionId: string, selected: string | null, result: StandaloneAnswerResult | null): OptionState {
  if (!result) return optionId === selected ? 'selected' : 'normal'
  if (optionId === result.correctOptionId) return 'correct'
  if (optionId === selected && !result.isCorrect) return 'wrong'
  return 'dimmed'
}

const optionStyles: Record<OptionState, string> = {
  normal: 'glass-card hover:scale-[1.02] hover:shadow-lift group',
  selected: 'glass-card scale-[1.02]',
  correct: 'glass-card scale-[1.02] bg-tertiary/15 border-tertiary/50',
  wrong: 'glass-card scale-[1.02] bg-error/15 border-error/50',
  dimmed: 'glass-card opacity-60',
}

export function QuestaoPage() {
  const { id } = useParams<{ id: string }>()
  const [question, setQuestion] = useState<QuestionDetail | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<StandaloneAnswerResult | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api
      .getQuestion(id)
      .then(setQuestion)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar a questão'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSelect = (optionId: string) => {
    if (!question || submitting || result) return
    setSelected(optionId)
    setError('')
  }

  const handleSubmit = async () => {
    if (!question || submitting || result || !selected) return
    setSubmitting(true)
    setError('')
    try {
      const res = await api.answerStandalone(question.id, selected)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar resposta')
      setSelected(null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    setSelected(null)
    setResult(null)
    setError('')
  }

  const answerText = (optionId: string): string =>
    question?.options.find((o) => o.id === optionId)?.text ?? ''

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />

      <main className="flex-grow w-full max-w-3xl mx-auto px-container-padding-mobile md:px-container-padding-desktop pt-24 md:pt-32 pb-40 md:pb-20 flex flex-col gap-stack-lg z-10">
        {loading ? (
          <>
            <div className="flex items-center justify-between w-full">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            <div className="flex flex-col gap-stack-md">
              <SkeletonText lines={3} className="gap-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            <div className="flex flex-col gap-stack-md pb-stack-lg">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </>
        ) : null}

        {question ? (
          <>
            <div className="flex items-center justify-between w-full">
              <Link
                to={`/disciplina/${question.discipline.id}`}
                className="inline-flex items-center gap-2 font-label-bold text-label-bold text-primary hover:underline w-fit"
              >
                <Icon name="arrow_back" className="text-primary" />
                {question.discipline.name}
              </Link>
              <span className="font-caption text-caption px-2 py-1 rounded-full bg-surface-container-high text-on-surface-variant">
                Questão {question.position}
              </span>
            </div>

            <div className="flex flex-col gap-stack-md">
              <h2 className="font-display text-display-lg-mobile md:text-headline-lg text-on-surface">
                {question.prompt}
              </h2>
              {question.context ? (
                <p className="font-body-md text-body-md text-on-surface-variant">{question.context}</p>
              ) : null}
              {question.lastAnswerCorrect !== null && !result ? (
                <span
                  className={`font-caption text-caption w-fit px-2 py-1 rounded-full inline-flex items-center gap-1.5 ${
                    question.lastAnswerCorrect ? 'bg-tertiary/15 text-tertiary' : 'bg-error/15 text-error'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${question.lastAnswerCorrect ? 'bg-tertiary' : 'bg-error'}`}
                  />
                  Última resposta: {question.lastAnswerCorrect ? 'correta' : 'errada'}
                </span>
              ) : null}
            </div>

            {error ? (
              <p className="font-body-md text-body-md text-error bg-error/10 rounded-xl p-stack-md" role="alert">
                {error}
              </p>
            ) : null}

            {result ? (
              <div
                className={`rounded-xl p-stack-md flex items-start gap-stack-md ${
                  result.isCorrect ? 'bg-tertiary/15 text-tertiary' : 'bg-error/15 text-error'
                }`}
                role="status"
              >
                <Icon name={result.isCorrect ? 'check_circle' : 'cancel'} className={result.isCorrect ? 'text-tertiary' : 'text-error'} />
                <div>
                  <p className="font-label-bold text-label-bold">
                    {result.isCorrect ? 'Resposta correta!' : 'Resposta errada.'}
                  </p>
                  {!result.isCorrect ? (
                    <p className="font-body-md text-body-md mt-1">
                      A alternativa correta é{' '}
                      <span className="font-semibold">{letters[question.options.findIndex((o) => o.id === result.correctOptionId)]}</span>:{' '}
                      {answerText(result.correctOptionId)}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-stack-md pb-stack-lg">
              {question.options.map((option, i) => {
                const state = optionState(option.id, selected, result)
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    disabled={submitting || Boolean(result)}
                    className={`rounded-2xl p-stack-md flex items-start gap-stack-md text-left transition-all duration-200 w-full relative overflow-hidden border border-outline-variant/30 ${optionStyles[state]}`}
                  >
                    {state === 'selected' ? (
                      <div className="absolute inset-0 bg-primary-container/10 pointer-events-none" />
                    ) : null}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-label-bold text-label-bold transition-colors ${
                        state === 'selected'
                          ? 'bg-primary-container text-on-primary shadow-[0_0_12px_rgba(0,82,255,0.4)]'
                          : state === 'correct'
                            ? 'bg-tertiary text-on-tertiary-container'
                            : state === 'wrong'
                              ? 'bg-error text-on-error'
                              : 'bg-background text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary'
                      }`}
                    >
                      {state === 'selected' || state === 'correct' || state === 'wrong' ? (
                        <Icon
                          name={state === 'wrong' ? 'close' : 'check'}
                          className={state === 'wrong' ? 'text-on-error' : state === 'correct' ? 'text-on-tertiary-container' : 'text-on-primary'}
                        />
                      ) : (
                        letters[i]
                      )}
                    </div>
                    <div
                      className={`font-body-md text-body-md pt-1 z-10 ${
                        state === 'selected' || state === 'correct' || state === 'wrong' ? 'font-medium' : 'text-on-surface'
                      }`}
                    >
                      {option.text}
                    </div>
                  </button>
                )
              })}

              {!result ? (
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!selected || submitting}
                  className="mt-2 w-full bg-primary text-on-primary font-label-bold text-label-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-glow disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <Icon name="progress_activity" className="text-on-primary animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Responder
                      <Icon name="arrow_forward" className="text-on-primary" />
                    </>
                  )}
                </button>
              ) : null}
            </div>

            {result ? (
              <div className="flex flex-col sm:flex-row gap-stack-md items-stretch">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 bg-secondary-container/20 text-secondary-fixed-dim font-label-bold text-label-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                >
                  <Icon name="replay" className="text-secondary-fixed-dim" />
                  Responder novamente
                </button>
                <Link
                  to={`/disciplina/${question.discipline.id}`}
                  className="flex-1 bg-primary text-on-primary font-label-bold text-label-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-glow"
                >
                  Voltar para a disciplina
                  <Icon name="arrow_forward" className="text-on-primary" />
                </Link>
              </div>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  )
}