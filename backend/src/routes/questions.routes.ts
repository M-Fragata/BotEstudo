import { Router } from "express"
import { validateBody, validateParams } from "../middleware/validate.ts"
import { authMiddleware } from "../middleware/auth.ts"
import { answerStandaloneSchema } from "../schemas/quiz.schema.ts"
import { idParamsSchema } from "../schemas/discipline.schema.ts"
import { prisma } from "../utils/prisma.ts"
import { AppError } from "../utils/errors.ts"

export const questionRoutes = Router()

questionRoutes.use(authMiddleware)

questionRoutes.get("/:id", validateParams(idParamsSchema), async (req, res) => {
  const { id } = req.params as { id: string }
  const question = await prisma.question.findFirst({
    where: { id, quiz: { userId: req.user!.id } },
    select: {
      id: true,
      position: true,
      prompt: true,
      context: true,
      options: true,
      lastAnswerCorrect: true,
      quiz: {
        select: {
          discipline: { select: { id: true, name: true } }
        }
      }
    }
  })
  if (!question) {
    throw new AppError(404, "Questão não encontrada")
  }
  res.json({
    id: question.id,
    position: question.position,
    prompt: question.prompt,
    context: question.context,
    options: question.options,
    lastAnswerCorrect: question.lastAnswerCorrect,
    discipline: question.quiz.discipline
  })
})

questionRoutes.post(
  "/:id/answer",
  validateParams(idParamsSchema),
  validateBody(answerStandaloneSchema),
  async (req, res) => {
    const { id } = req.params as { id: string }
    const question = await prisma.question.findFirst({
      where: { id, quiz: { userId: req.user!.id } },
      select: { id: true, correctOptionId: true }
    })
    if (!question) {
      throw new AppError(404, "Questão não encontrada")
    }

    const isCorrect = req.body.selectedOptionId === question.correctOptionId

    await prisma.question.update({
      where: { id: question.id },
      data: { lastAnswerCorrect: isCorrect }
    })

    res.json({
      questionId: question.id,
      isCorrect,
      correctOptionId: question.correctOptionId
    })
  }
)