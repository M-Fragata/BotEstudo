import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { TopBar, MobileNav } from '../components/Nav'
import { GlassCard } from '../components/GlassCard'
import { CircularProgress } from '../components/CircularProgress'
import { Chip } from '../components/Chip'
import { ResultCard } from '../components/ResultCard'
import { Button } from '../components/Button'
import { Skeleton, SkeletonCircle } from '../components/Skeleton'
import { api } from '../api/client'
import { Logo } from '../components/Logo'
import type { QuizResult, ResultNavState } from '../api/client'

const confettiColors = ['#0052FF', '#FFC700', '#10B981', '#F43F5E', '#CBD5E1']

interface ConfettiPiece {
  id: number
  left: number
  color: string
  delay: number
  duration: number
  round: boolean
}

const confetti: ConfettiPiece[] = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
  delay: Math.random() * 1,
  duration: 2 + Math.random() * 2,
  round: Math.random() > 0.5,
}))

export function ResultadoPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const navState = (location.state ?? null) as ResultNavState | null
  const [result, setResult] = useState<QuizResult | null>(navState?.result ?? null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'Resultado do Simulado | Lumina Learn'
  }, [])

  useEffect(() => {
    if (result) return
    if (!navState?.sessionId) {
      navigate('/', { replace: true })
      return
    }
    setLoading(true)
    api
      .sessionResult(navState.sessionId)
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar resultado'))
      .finally(() => setLoading(false))
  }, [navState, result, navigate])

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      {/* Mobile top bar */}
      <header className="md:hidden w-full flex justify-between items-center px-margin-mobile py-4 fixed top-0 z-40 bg-surface/80 backdrop-blur-md shadow-card">
        <Logo />
        <div className="flex gap-4 text-primary">
          <Link to="/perfil" className="flex items-center">
            <span className="material-symbols-outlined cursor-pointer hover:scale-105 transition-transform duration-200">
              account_circle
            </span>
          </Link>
        </div>
      </header>

      <main className="w-full px-container-padding-mobile md:px-container-padding-desktop pt-24 md:pt-32 pb-36 md:pb-16 max-w-[1280px] mx-auto flex-grow relative">
        {error ? (
          <p className="font-body-md text-body-md text-error bg-error/10 rounded-xl p-stack-md mb-stack-lg" role="alert">
            {error}
          </p>
        ) : null}

        {loading && !error ? (
          <GlassCard className="relative overflow-hidden p-stack-lg flex flex-col items-center text-center mb-stack-lg max-w-2xl mx-auto">
            <Skeleton className="h-8 w-64 mb-stack-sm" />
            <Skeleton className="h-4 w-48 mb-stack-md" />
            <SkeletonCircle className="w-40 h-40 mb-stack-md" />
            <Skeleton className="h-6 w-56 rounded-full" />
          </GlassCard>
        ) : null}

        {result ? (
          <>
            <GlassCard className="relative overflow-hidden p-stack-lg flex flex-col items-center text-center mb-stack-lg max-w-2xl mx-auto">
              {confetti.map((c) => (
                <span
                  key={c.id}
                  className="confetti"
                  style={{
                    left: `${c.left}%`,
                    backgroundColor: c.color,
                    borderRadius: c.round ? '50%' : undefined,
                    animationDelay: `${c.delay}s`,
                    animationDuration: `${c.duration}s`,
                  }}
                />
              ))}
              <h1 className="font-display text-headline-lg text-primary mb-stack-sm relative z-10">
                Simulado Concluído!
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md relative z-10">
                Ótimo trabalho! Aqui está o seu desempenho.
              </p>
              <CircularProgress
                score={result.score}
                correctCount={result.correctCount}
                total={result.total}
              />
              <div className="mt-stack-md relative z-10">
                <Chip tone="secondary" icon="auto_awesome">
                  {result.feedback}
                </Chip>
              </div>
            </GlassCard>

            <section className="max-w-2xl mx-auto flex flex-col gap-stack-md">
              <h2 className="font-display text-headline-md font-semibold text-on-surface">
                Detalhes por Questão
              </h2>
              {result.items.map((item) => (
                <ResultCard key={item.questionNumber} item={item} />
              ))}
            </section>
          </>
        ) : null}
      </main>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-md border-t border-outline-variant p-margin-mobile md:p-4 z-40 flex flex-col sm:flex-row gap-stack-sm justify-center">
        <Button
          variant="gradient"
          fullWidth
          leadingIcon="menu_book"
          className="sm:max-w-xs"
          onClick={() => navigate('/')}
        >
          Voltar às Disciplinas
        </Button>
        <Button
          variant="outline"
          fullWidth
          leadingIcon="refresh"
          className="sm:max-w-xs"
          onClick={() => navigate('/gerar')}
        >
          Novo Simulado
        </Button>
      </div>

      <MobileNav />
    </div>
  )
}