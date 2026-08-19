import { useNavigate } from 'react-router-dom'
import { TopBar, MobileNav } from '../components/Nav'
import { GlassCard } from '../components/GlassCard'
import { Button } from '../components/Button'
import { useAuth } from '../auth/useAuth'

function initialsOf(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return (parts[0]?.[0] ?? '').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      <main className="w-full max-w-md mx-auto px-container-padding-mobile pt-24 pb-28 md:max-w-2xl md:pt-32 md:pb-16">
        <GlassCard className="p-stack-lg flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary-container/20 text-primary flex items-center justify-center font-display text-display-lg-mobile mb-stack-md shadow-glow">
            {initialsOf(user?.name, user?.email ?? '')}
          </div>
          <h1 className="font-display text-headline-lg text-on-surface mb-1">
            {user?.name ?? user?.email}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">{user?.email}</p>

          <div className="w-full flex flex-col gap-stack-md">
            <div className="bg-surface-variant/50 rounded-xl p-stack-md flex items-center gap-stack-md text-left">
              <span className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  verified_user
                </span>
              </span>
              <div>
                <div className="font-label-bold text-label-bold text-on-surface">Conta verificada</div>
                <div className="font-caption text-caption text-on-surface-variant">
                  Login por e-mail e senha
                </div>
              </div>
            </div>

            <div className="bg-surface-variant/50 rounded-xl p-stack-md flex items-center gap-stack-md text-left">
              <span className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  school
                </span>
              </span>
              <div>
                <div className="font-label-bold text-label-bold text-on-surface">Fragata Quiz</div>
                <div className="font-caption text-caption text-on-surface-variant">
                  Smart AI Study Simulator
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            fullWidth
            leadingIcon="logout"
            className="mt-stack-lg"
            onClick={handleLogout}
          >
            Sair da conta
          </Button>
        </GlassCard>
      </main>

      <MobileNav />
    </div>
  )
}