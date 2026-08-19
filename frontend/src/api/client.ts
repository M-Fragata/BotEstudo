export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const TOKEN_KEY = 'lumina_token'
const USER_KEY = 'lumina_user'

export interface ApiUser {
  id: string
  email: string
  name: string | null
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): ApiUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ApiUser
  } catch {
    return null
  }
}

export function storeSession(user: ApiUser, token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`/api${path}`, { ...options, headers })

  if (!res.ok) {
    let message = `Erro ${res.status}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // corpo não-JSON
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  login(email: string, password: string) {
    return request<{ user: ApiUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  register(name: string, email: string, password: string) {
    return request<{ user: ApiUser; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
  },

  me() {
    return request<{ user: { id: string; email: string } }>('/auth/me')
  },

  stats() {
    return request<StatsResponse>('/stats')
  },

  createDiscipline(name: string) {
    return request<Discipline>('/disciplines', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  },

  getDiscipline(id: string) {
    return request<DisciplineDetail>(`/disciplines/${id}`)
  },

  startDisciplineQuiz(disciplineId: string) {
    return request<DisciplineSimulado>(`/disciplines/${disciplineId}/simulado`, {
      method: 'POST',
    })
  },

  getQuestion(id: string) {
    return request<QuestionDetail>(`/questions/${id}`)
  },

  answerStandalone(questionId: string, selectedOptionId: string) {
    return request<StandaloneAnswerResult>(`/questions/${questionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ selectedOptionId }),
    })
  },

  createMaterial(input: { disciplineId: string; title: string; content?: string }) {
    return request<{ id: string }>('/materials', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  generateQuiz(input: { disciplineId: string; materialId?: string; questionCount: number }) {
    return request<GeneratedQuiz>('/quizzes/generate', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  createSession(quizId: string) {
    return request<SessionMeta>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ quizId }),
    })
  },

  answerQuestion(sessionId: string, questionId: string, selectedOptionId: string) {
    return request<{ questionId: string; isCorrect: boolean }>(`/sessions/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, selectedOptionId }),
    })
  },

  finishSession(sessionId: string) {
    return request<QuizResult>('/sessions/' + sessionId + '/finish', { method: 'POST' })
  },

  sessionResult(sessionId: string) {
    return request<QuizResult>('/sessions/' + sessionId)
  },
}

export interface Discipline {
  id: string
  name: string
  icon: string | null
  tone: string | null
  retention: number
}

export interface DisciplineQuestion {
  id: string
  position: number
  prompt: string
  lastAnswerCorrect: boolean | null
}

export interface DisciplineDetail extends Discipline {
  createdAt: string
  questions: DisciplineQuestion[]
}

export interface QuestionDetail {
  id: string
  position: number
  prompt: string
  context: string | null
  options: QuestionOption[]
  lastAnswerCorrect: boolean | null
  discipline: { id: string; name: string }
}

export interface StandaloneAnswerResult {
  questionId: string
  isCorrect: boolean
  correctOptionId: string
}

export interface QuestionOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  position: number
  prompt: string
  context: string | null
  options: QuestionOption[]
}

export interface GeneratedQuiz {
  id: string
  title: string
  questions: QuizQuestion[]
}

export interface DisciplineSimulado extends GeneratedQuiz {
  sessionId: string
}

export interface SessionMeta {
  sessionId: string
  currentIndex: number
  totalQuestions: number
}

export interface StatsResponse {
  stats: {
    weeklyProgress: number
    questionsAnswered: number
    studyTime: string
  }
  disciplines: Discipline[]
}

export interface ResultItem {
  questionNumber: number
  prompt: string
  userAnswer: string
  correctAnswer?: string
  correct: boolean
}

export interface QuizResult {
  score: number
  correctCount: number
  total: number
  items: ResultItem[]
  feedback: string
}

export interface QuizNavState {
  quizId: string
  sessionId: string
  title: string
  questions: QuizQuestion[]
}

export interface ResultNavState {
  sessionId: string
  result?: QuizResult
}