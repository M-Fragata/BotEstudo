import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TopBar, MobileNav } from '../components/Nav'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { Skeleton, SkeletonText } from '../components/Skeleton'
import { api } from '../api/client'
import type { DisciplineDetail, DisciplineQuestion, QuizNavState } from '../api/client'

type QuestionStatus = 'pendente' | 'errada' | 'correta'

function statusDaQuestao(q: DisciplineQuestion): QuestionStatus {
  if (q.lastAnswerCorrect === null) return 'pendente'
  return q.lastAnswerCorrect ? 'correta' : 'errada'
}

const stylesPorStatus: Record<QuestionStatus, { card: string; pill: string; label: string; dot: string }> = {
  pendente: {
    card: 'bg-surface-container-low border-outline-variant/50',
    pill: 'bg-surface-container-high text-on-surface-variant',
    label: 'Não respondida',
    dot: 'bg-outline',
  },
  errada: {
    card: 'bg-error/10 border-error/40',
    pill: 'bg-error/15 text-error',
    label: 'Última resposta errada',
    dot: 'bg-error',
  },
  correta: {
    card: 'bg-tertiary/10 border-tertiary/40',
    pill: 'bg-tertiary/15 text-tertiary',
    label: 'Última resposta correta',
    dot: 'bg-tertiary',
  },
}

export function DisciplinaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [discipline, setDiscipline] = useState<DisciplineDetail | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api
      .getDiscipline(id)
      .then(setDiscipline)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar a disciplina'))
      .finally(() => setLoading(false))
  }, [id])

  const handleIniciarSimulado = async () => {
    if (busy || !discipline || discipline.questions.length === 0) return
    setBusy(true)
    try {
      const simulado = await api.startDisciplineQuiz(discipline.id)
      const state: QuizNavState = {
        quizId: simulado.id,
        sessionId: simulado.sessionId,
        title: simulado.title,
        questions: simulado.questions,
      }
      navigate('/simulado', { state })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar simulado')
    } finally {
      setBusy(false)
    }
  }

  const legenda: Array<{ status: QuestionStatus; texto: string }> = [
    { status: 'pendente', texto: 'Não respondida' },
    { status: 'errada', texto: 'Última errada' },
    { status: 'correta', texto: 'Última correta' },
  ]

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-16">
      <TopBar />

      <main className="pt-24 md:pt-32 px-container-padding-mobile md:px-container-padding-desktop max-w-5xl mx-auto flex flex-col gap-stack-lg">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-label-bold text-label-bold text-primary hover:underline w-fit"
        >
          <Icon name="arrow_back" className="text-primary" />
          Voltar
        </Link>

        {error && !discipline ? (
          <p className="font-body-md text-body-md text-error bg-error/10 rounded-xl p-stack-md" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <>
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
              <div className="flex flex-col gap-stack-sm w-full max-w-sm">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-44" />
              </div>
              <Button variant="gradient" disabled>
                Iniciar Simulado
              </Button>
            </section>

            <section className="flex flex-wrap items-center gap-stack-md">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-5 w-28 rounded-full" />
              ))}
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-stack-md border border-outline-variant/30 bg-surface-container-lowest flex flex-col gap-stack-md"
                >
                  <Skeleton className="h-4 w-24" />
                  <SkeletonText lines={3} className="gap-1.5" />
                </div>
              ))}
            </section>
          </>
        ) : null}

        {discipline ? (
          <>
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
              <div>
                <h2 className="font-display text-headline-lg text-primary tracking-tight">
                  {discipline.name}
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  Conclusão: {discipline.retention}% · {discipline.questions.length}{' '}
                  {discipline.questions.length === 1 ? 'questão' : 'questões'} no total
                </p>
              </div>
              <Button
                variant="gradient"
                onClick={() => void handleIniciarSimulado()}
                disabled={busy || discipline.questions.length === 0}
              >
                {busy ? 'Iniciando...' : 'Iniciar Simulado'}
              </Button>
            </section>

            {error ? (
              <p className="font-body-md text-body-md text-error bg-error/10 rounded-xl p-stack-md" role="alert">
                {error}
              </p>
            ) : null}

            <section className="flex flex-wrap items-center gap-stack-md">
              {legenda.map(({ status, texto }) => (
                <span
                  key={status}
                  className="font-caption text-caption text-on-surface-variant inline-flex items-center gap-1.5"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${stylesPorStatus[status].dot}`} />
                  {texto}
                </span>
              ))}
            </section>

            {discipline.questions.length === 0 ? (
              <p className="font-body-md text-body-md text-on-surface-variant bg-surface-container-lowest rounded-2xl p-stack-md border border-outline-variant/30">
                Nenhuma questão ainda. Gere um simulado para começar.
              </p>
            ) : (
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                {discipline.questions.map((question) => {
                  const status = statusDaQuestao(question)
                  const style = stylesPorStatus[status]
                  return (
                    <Link
                      key={question.id}
                      to={`/questao/${question.id}`}
                      className={`rounded-2xl p-stack-md border shadow-card flex flex-col gap-stack-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lift ${style.card}`}
                    >
                      <div className="flex items-center justify-between gap-stack-sm">
                        <span className="font-label-bold text-label-bold text-on-surface-variant">
                          Questão {question.position}
                        </span>

                      </div>
                      <p className="font-body-md text-body-md text-on-surface line-clamp-3">
                        {question.prompt}
                      </p>
                    </Link>
                  )
                })}
              </section>
            )}
          </>
        ) : null}
      </main>

      <MobileNav />
    </div>
  )
}