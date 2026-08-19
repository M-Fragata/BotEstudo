import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TopBar } from '../components/Nav'
import { ProgressBar } from '../components/ProgressBar'
import { QuestionOption } from '../components/QuestionOption'
import { Icon } from '../components/Icon'
import { api } from '../api/client'
import type { QuizNavState } from '../api/client'
import type { QuestionOption as Option } from '../api/client'

const letters = ['A', 'B', 'C', 'D']
const QUIZ_DURATION_SECONDS = 15 * 60

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function SimuladoPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const quiz = (location.state ?? null) as QuizNavState | null

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [secondsLeft, setSecondsLeft] = useState(QUIZ_DURATION_SECONDS)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const finishedRef = useRef(false)
  const pendingSubmitRef = useRef<Promise<unknown> | null>(null)

  useEffect(() => {
    if (!quiz) {
      navigate('/', { replace: true })
    }
  }, [quiz, navigate])

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const submitAnswer = useCallback(
    (questionId: string, optionId: string) => {
      if (!quiz || finishedRef.current) return
      const p = api.answerQuestion(quiz.sessionId, questionId, optionId).catch(() => {
        // falha de rede no envio da resposta: segue com a sessão
      })
      pendingSubmitRef.current = p
      void p.finally(() => {
        if (pendingSubmitRef.current === p) pendingSubmitRef.current = null
      })
    },
    [quiz],
  )

  const handleSelect = useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
      submitAnswer(questionId, optionId)
    },
    [submitAnswer],
  )

  const handleFinish = useCallback(async () => {
    if (!quiz || finishedRef.current) return
    finishedRef.current = true
    setSubmitting(true)

    if (pendingSubmitRef.current) {
      await pendingSubmitRef.current
    }

    try {
      const result = await api.finishSession(quiz.sessionId)
      navigate('/resultado', { state: { sessionId: quiz.sessionId, result } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao finalizar simulado')
      finishedRef.current = false
      setSubmitting(false)
    }
  }, [quiz, navigate])

  useEffect(() => {
    if (secondsLeft === 0) {
      const timeout = setTimeout(() => void handleFinish(), 0)
      return () => clearTimeout(timeout)
    }
  }, [secondsLeft, handleFinish])

  if (!quiz) {
    return null
  }

  const current = quiz.questions[index]
  if (!current) {
    return null
  }

  const progress = ((index + 1) / quiz.questions.length) * 100
  const lowTime = secondsLeft <= 60

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-md px-container-padding-mobile py-4 flex items-center justify-between border-b border-surface-variant">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-on-surface hover:text-primary transition-colors flex items-center justify-center p-2 rounded-full hover:bg-surface-variant"
          aria-label="Fechar simulado"
        >
          <Icon name="close" />
        </button>
        <div className="font-display text-headline-md text-primary tracking-tight">
          {quiz.title}
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-grow w-full max-w-3xl mx-auto px-container-padding-mobile md:px-container-padding-desktop pt-24 md:pt-32 pb-40 md:pb-20 flex flex-col gap-stack-lg z-10">
        <div className="flex flex-col gap-stack-sm w-full">
          <div className="flex justify-between items-center w-full">
            <span className="font-label-bold text-label-bold text-outline">
              Questão {index + 1} de {quiz.questions.length}
            </span>
            <span
              className={`font-caption text-caption px-2 py-1 rounded-full flex items-center gap-1 ${
                lowTime ? 'bg-error/15 text-error' : 'bg-secondary-container/20 text-[#B8860B]'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                timer
              </span>{' '}
              {formatTime(secondsLeft)}
            </span>
          </div>
          <ProgressBar value={progress} />
        </div>

        <div className="flex flex-col gap-stack-md">
          <h2 className="font-display text-display-lg-mobile md:text-headline-lg text-on-surface">
            {current.prompt}
          </h2>
          {current.context ? (
            <p className="font-body-md text-body-md text-on-surface-variant">{current.context}</p>
          ) : null}
        </div>

        {error ? (
          <p className="font-body-md text-body-md text-error bg-error/10 rounded-xl p-stack-md" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md pb-stack-lg">
          {current.options.map((option: Option, i) => (
            <QuestionOption
              key={option.id}
              letter={letters[i]}
              text={option.text}
              selected={answers[current.id] === option.id}
              onSelect={() => handleSelect(current.id, option.id)}
            />
          ))}
        </div>
      </main>

      <footer className="fixed bottom-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-t border-surface-variant px-container-padding-mobile py-stack-md flex items-center justify-between gap-stack-sm rounded-t-2xl shadow-bar max-w-3xl mx-auto left-0 right-0">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0 || submitting}
          className="flex-1 bg-transparent border-2 border-primary-container text-primary-container font-label-bold text-label-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container/10 transition-colors max-w-[180px] disabled:opacity-50"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            arrow_back
          </span>{' '}
          Anterior
        </button>
        {index < quiz.questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(quiz.questions.length - 1, i + 1))}
            className="flex-1 bg-primary-container text-on-primary font-label-bold text-label-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_4px_12px_rgba(0,82,255,0.4)] max-w-[180px]"
          >
            Próxima{' '}
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              arrow_forward
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleFinish()}
            disabled={submitting}
            className="flex-1 bg-primary font-label-bold text-label-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-glow max-w-[180px] text-on-primary disabled:opacity-60"
          >
            {submitting ? 'Enviando...' : 'Ver Resultado'}
          </button>
        )}
        <button
          type="button"
          onClick={() => void handleFinish()}
          disabled={submitting}
          className="flex-1 bg-secondary text-on-secondary font-label-bold text-label-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_4px_12px_rgba(255,199,0,0.4)] max-w-[200px] disabled:opacity-50"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            flag
          </span>{' '}
          Finalizar
        </button>
      </footer>
    </div>
  )
}