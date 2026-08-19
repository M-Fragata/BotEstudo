import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { SimuladoPage } from './pages/SimuladoPage'
import { ResultadoPage } from './pages/ResultadoPage'
import { GerarQuestoesPage } from './pages/GerarQuestoesPage'
import { ProfilePage } from './pages/ProfilePage'
import { DisciplinaPage } from './pages/DisciplinaPage'
import { QuestaoPage } from './pages/QuestaoPage'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: 40 }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/simulado"
        element={
          <ProtectedRoute>
            <SimuladoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resultado"
        element={
          <ProtectedRoute>
            <ResultadoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gerar"
        element={
          <ProtectedRoute>
            <GerarQuestoesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/disciplina/:id"
        element={
          <ProtectedRoute>
            <DisciplinaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/questao/:id"
        element={
          <ProtectedRoute>
            <QuestaoPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}