export type SubjectAction = 'praticar' | 'revisar'

export interface Subject {
  id: string
  name: string
  icon: string
  retention: number
  trend: 'up' | 'down' | 'flat'
  action: SubjectAction
  tone: 'primary' | 'secondary' | 'tertiary'
}

export interface ResultItem {
  questionNumber: number
  prompt: string
  userAnswer: string
  correctAnswer?: string
  correct: boolean
}