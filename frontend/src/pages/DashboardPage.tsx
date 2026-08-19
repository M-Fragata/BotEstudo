import { useEffect, useState } from 'react'
import { TopBar, MobileNav } from '../components/Nav'
import { GlassCard } from '../components/GlassCard'
import { ProgressBar } from '../components/ProgressBar'
import { StatCard } from '../components/StatCard'
import { SubjectCard } from '../components/SubjectCard'
import { Skeleton } from '../components/Skeleton'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import type { ApiUser } from '../api/client'
import type { Subject } from '../types'

function mapDiscipline(d: {
  id: string
  name: string
  icon: string | null
  tone: string | null
  retention: number
}): Subject {
  const tones = ['primary', 'secondary', 'tertiary'] as const
  const tone = (['primary', 'secondary', 'tertiary'] as const).includes(
    d.tone as (typeof tones)[number],
  )
    ? (d.tone as (typeof tones)[number])
    : tones[d.retention >= 50 ? 0 : 1]

  const trend: Subject['trend'] = d.retention >= 70 ? 'up' : d.retention >= 40 ? 'flat' : 'down'
  const action: Subject['action'] = d.retention < 60 ? 'revisar' : 'praticar'

  return {
    id: d.id,
    name: d.name,
    icon: d.icon ?? 'menu_book',
    retention: Math.round(d.retention),
    trend,
    action,
    tone,
  }
}

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<{ weeklyProgress: number; questionsAnswered: number; studyTime: string } | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .stats()
      .then((res) => {
        setStats(res.stats)
        setSubjects(res.disciplines.map(mapDiscipline))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar dados'))
      .finally(() => setLoading(false))
  }, [])

  const displayName = (user: ApiUser | null): string => {
    if (user?.name) return user.name.split(' ')[0]
    if (user?.email) return user.email.split('@')[0]
    return 'Estudante'
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      <main className="w-full max-w-md mx-auto px-container-padding-mobile pt-stack-lg pb-28 md:max-w-7xl md:pt-[100px] md:pb-16 md:px-container-padding-desktop">
        <section className="mb-stack-lg mt-stack-md md:mt-0">
          <h1 className="font-display text-display-lg-mobile md:text-headline-lg text-on-background mb-1">
            Olá, {displayName(user)}! 👋
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Pronto para continuar aprendendo?
          </p>
        </section>

        {error ? (
          <p className="font-body-md text-body-md text-error bg-error/10 rounded-xl p-stack-md mb-stack-lg" role="alert">
            {error}
          </p>
        ) : null}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-stack-lg">
          <GlassCard className="relative overflow-hidden p-stack-md md:p-stack-lg col-span-1 md:col-span-2">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              {loading ? (
                <div className="flex flex-col gap-stack-md">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <div className="flex justify-between gap-stack-sm">
                    <Skeleton className="h-16 w-1/3 rounded-xl" />
                    <Skeleton className="h-16 w-1/3 rounded-xl" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-stack-md">
                    <h2 className="font-display text-headline-md text-on-background">
                      Progresso Semanal
                    </h2>
                    <span className="font-label-bold text-label-bold text-primary bg-primary-container/20 px-stack-sm py-1 rounded-full">
                      {stats ? `${stats.weeklyProgress}%` : '--'}
                    </span>
                  </div>
                  <ProgressBar value={stats?.weeklyProgress ?? 0} className="mb-stack-md" />
                  <div className="flex justify-between gap-stack-sm">
                    <StatCard
                      icon="quiz"
                      value={stats ? stats.questionsAnswered.toString() : '--'}
                      label="Questões"
                      tone="secondary"
                    />
                    <StatCard
                      icon="timer"
                      value={stats?.studyTime ?? '--'}
                      label="Tempo Estudo"
                      tone="tertiary"
                    />
                  </div>
                </>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-stack-md md:p-stack-lg col-span-1 flex flex-col gap-stack-md">
            <h2 className="font-display text-headline-md text-on-background">Dica da IA</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Revise as disciplinas com menor retenção para melhorar seus resultados nos simulados.
            </p>
            <button
              type="button"
              className="mt-auto bg-secondary-container/20 text-secondary-fixed-dim font-label-bold text-label-bold p-3 rounded-xl hover:scale-[1.01] transition-transform"
            >
              Ver plano de estudos
            </button>
          </GlassCard>
        </section>

        <section>
          <div className="flex justify-between items-end mb-stack-md">
            <h2 className="font-display text-headline-md text-on-background">Disciplinas</h2>
            <a className="font-label-bold text-label-bold text-primary hover:underline" href="#">
              Ver todas
            </a>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="glass-card rounded-2xl p-stack-md border border-outline-variant/30 flex flex-col gap-stack-sm"
                >
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {subjects.length === 0 && !error ? (
                <p className="font-body-md text-body-md text-on-surface-variant bg-surface-container-lowest rounded-2xl p-stack-md border border-outline-variant/30">
                  Você ainda não tem disciplinas. Acesse "Practice" no menu para criar um simulado a
                  partir de um material.
                </p>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                {subjects.map((subject) => (
                  <SubjectCard key={subject.id} subject={subject} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <MobileNav />
    </div>
  )
}