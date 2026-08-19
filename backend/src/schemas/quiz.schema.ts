import z from "zod"

export const generateQuizSchema = z.object({
  disciplineId: z.string().min(1, "Disciplina obrigatória"),
  materialId: z.string().optional(),
  questionCount: z.coerce.number().int().min(1).max(30).default(30)
})

export const createSessionSchema = z.object({
  quizId: z.string().min(1, "Quiz obrigatório")
})

export const answerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1)
})

export const answersSchema = z.object({
  answers: z.array(answerSchema).max(100)
})

export const answerStandaloneSchema = z.object({
  selectedOptionId: z.string().min(1, "Alternativa obrigatória")
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type GenerateQuizInput = z.infer<typeof generateQuizSchema>
export type AnswerInput = z.infer<typeof answerSchema>
export type AnswersInput = z.infer<typeof answersSchema>