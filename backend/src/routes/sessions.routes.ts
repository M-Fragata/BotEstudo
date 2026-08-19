import { Router } from "express"
import { validateBody, validateParams } from "../middleware/validate.ts"
import { authMiddleware } from "../middleware/auth.ts"
import { answerSchema, createSessionSchema } from "../schemas/quiz.schema.ts"
import { idParamsSchema } from "../schemas/discipline.schema.ts"
import {
  answerQuestion,
  createSession,
  finishSession,
  getSessionResult
} from "../services/quiz.service.ts"

export const sessionRoutes = Router()

sessionRoutes.use(authMiddleware)

sessionRoutes.post("/", validateBody(createSessionSchema), async (req, res, next) => {
  try {
    const session = await createSession(req.user!.id, req.body.quizId)
    res.status(201).json(session)
  } catch (err) {
    next(err)
  }
})

sessionRoutes.get("/:id", validateParams(idParamsSchema), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }
    const result = await getSessionResult(req.user!.id, id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

sessionRoutes.post(
  "/:id/answer",
  validateParams(idParamsSchema),
  validateBody(answerSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params as { id: string }
      const result = await answerQuestion(req.user!.id, id, req.body)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }
)

sessionRoutes.post("/:id/finish", validateParams(idParamsSchema), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }
    const result = await finishSession(req.user!.id, id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})