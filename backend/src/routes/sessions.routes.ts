import { Router } from "express"
import { validateBody, validateParams } from "../middleware/validate.ts"
import { authMiddleware } from "../middleware/auth.ts"
import { answerSchema, answersSchema, createSessionSchema } from "../schemas/quiz.schema.ts"
import { idParamsSchema } from "../schemas/discipline.schema.ts"
import {
  answerBatch,
  answerQuestion,
  createSession,
  finishSession,
  getSessionResult
} from "../services/quiz.service.ts"

export const sessionRoutes = Router()

sessionRoutes.use(authMiddleware)

sessionRoutes.post("/", validateBody(createSessionSchema), async (req, res) => {
  const session = await createSession(req.user!.id, req.body.quizId)
  res.status(201).json(session)
})

sessionRoutes.get("/:id", validateParams(idParamsSchema), async (req, res) => {
  const { id } = req.params as { id: string }
  const result = await getSessionResult(req.user!.id, id)
  res.json(result)
})

sessionRoutes.post(
  "/:id/answer",
  validateParams(idParamsSchema),
  validateBody(answerSchema),
  async (req, res) => {
    const { id } = req.params as { id: string }
    const result = await answerQuestion(req.user!.id, id, req.body)
    res.json(result)
  }
)

sessionRoutes.post(
  "/:id/answers",
  validateParams(idParamsSchema),
  validateBody(answersSchema),
  async (req, res) => {
    const { id } = req.params as { id: string }
    const result = await answerBatch(req.user!.id, id, req.body)
    res.json(result)
  }
)

sessionRoutes.post("/:id/finish", validateParams(idParamsSchema), async (req, res) => {
  const { id } = req.params as { id: string }
  const result = await finishSession(req.user!.id, id)
  res.json(result)
})