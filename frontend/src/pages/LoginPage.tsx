import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Icon } from '../components/Icon'
import { useAuth } from '../auth/useAuth'

type AuthMode = 'login' | 'signup'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-container-padding-mobile relative overflow-hidden font-body-md">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-secondary/20 rounded-full blur-3xl z-0" />

      <main className="w-full max-w-sm z-10 flex flex-col items-center">
        <header className="mb-stack-lg text-center flex flex-col items-center">
          <span className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-stack-md shadow-glow">
            <Icon name="school" filled className="text-on-primary text-display-lg-mobile" />
          </span>
          <h1 className="font-display text-display-lg-mobile text-primary tracking-tight">
            Lumina Learn
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-stack-sm">
            Acesse sua jornada de aprendizado
          </p>
        </header>

        <div className="glass-card w-full rounded-2xl p-container-padding-desktop border border-outline-variant/70">
          <div className="flex bg-surface-variant/40 rounded-lg p-1 mb-stack-lg relative">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-surface-container-lowest rounded-md shadow-md transition-transform duration-300 ease-in-out"
              style={{ left: mode === 'login' ? '0.25rem' : '50%' }}
            />
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
              }}
              className={`flex-1 py-2 text-center font-label-bold text-label-bold relative z-10 transition-colors duration-200 ${
                mode === 'login' ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError('')
              }}
              className={`flex-1 py-2 text-center font-label-bold text-label-bold relative z-10 transition-colors duration-200 ${
                mode === 'signup' ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form className="flex flex-col gap-stack-md" onSubmit={handleSubmit}>
            {mode === 'signup' ? (
              <div className="flex flex-col gap-base">
                <label
                  className="font-label-bold text-label-bold text-on-surface-variant ml-base"
                  htmlFor="name"
                >
                  Nome
                </label>
                <div className="relative">
                  <Icon name="person" className="absolute left-stack-md top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    className="w-full bg-[#F8FAFC] border-none rounded-xl pl-12 pr-stack-md py-3 text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-body-md text-body-md shadow-sm"
                    id="name"
                    placeholder="Seu nome"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-base">
              <label
                className="font-label-bold text-label-bold text-on-surface-variant ml-base"
                htmlFor="email"
              >
                E-mail
              </label>
              <div className="relative">
                <Icon name="mail" className="absolute left-stack-md top-1/2 -translate-y-1/2 text-outline" />
                <input
                  className="w-full bg-[#F8FAFC] border-none rounded-xl pl-12 pr-stack-md py-3 text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-body-md text-body-md shadow-sm"
                  id="email"
                  placeholder="seu@email.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-base">
              <label
                className="font-label-bold text-label-bold text-on-surface-variant ml-base"
                htmlFor="password"
              >
                Senha
              </label>
              <div className="relative">
                <Icon name="lock" className="absolute left-stack-md top-1/2 -translate-y-1/2 text-outline" />
                <input
                  className="w-full bg-[#F8FAFC] border-none rounded-xl pl-12 pr-10 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-body-md text-body-md shadow-sm"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-stack-md top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <Icon name={showPassword ? 'visibility' : 'visibility_off'} />
                </button>
              </div>
            </div>

            {error ? (
              <p className="font-caption text-caption text-error bg-error/10 rounded-lg p-2 text-center" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end mt-base">
              <a className="font-label-bold text-label-bold text-primary hover:text-secondary transition-colors" href="#">
                Esqueceu a senha?
              </a>
            </div>

            <div className="mt-stack-sm">
              <Button variant="gradient" fullWidth type="submit" disabled={busy}>
                {busy
                  ? 'Aguarde...'
                  : mode === 'login'
                    ? 'Acessar Plataforma'
                    : 'Criar Minha Conta'}
              </Button>
            </div>

            <div className="relative flex items-center justify-center mt-stack-md">
              <div className="border-t border-outline-variant absolute w-full" />
              <span className="bg-surface-container-lowest px-stack-sm font-label-bold text-label-bold text-on-surface-variant relative z-10 rounded-full">
                ou continue com
              </span>
            </div>

            <div className="flex gap-stack-sm mt-stack-sm">
              <button
                type="button"
                onClick={() => setError('Login com Google estará disponível em breve.')}
                className="flex-1 flex items-center justify-center gap-base py-3 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-[#F8FAFC] transition-colors shadow-sm font-label-bold text-label-bold"
              >
                G
                <span className="text-on-surface">Google</span>
              </button>
              <button
                type="button"
                onClick={() => setError('Login com Apple estará disponível em breve.')}
                className="flex-1 flex items-center justify-center gap-base py-3 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-[#F8FAFC] transition-colors shadow-sm font-label-bold text-label-bold"
              >
                <Icon name="file_download" filled />
                <span className="text-on-surface">Apple</span>
              </button>
            </div>
          </form>
        </div>

        <p className="mt-stack-lg font-caption text-caption text-on-surface-variant text-center max-w-[280px]">
          Ao continuar, você concorda com nossos{' '}
          <a className="text-primary hover:text-secondary transition-colors underline decoration-primary/30 underline-offset-2" href="#">
            Termos de Serviço
          </a>{' '}
          e{' '}
          <a className="text-primary hover:text-secondary transition-colors underline decoration-primary/30 underline-offset-2" href="#">
            Política de Privacidade
          </a>
          .
        </p>
      </main>
    </div>
  )
}