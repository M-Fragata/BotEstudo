import { Router } from "express"
import { validateBody } from "../middleware/validate.ts"
import { authMiddleware } from "../middleware/auth.ts"
import { generateQuizSchema } from "../schemas/quiz.schema.ts"
import { generateQuiz, listQuizzes } from "../services/quiz.service.ts"

export const quizRoutes = Router()

quizRoutes.use(authMiddleware)

quizRoutes.get("/", async (req, res, next) => {
  try {
    const quizzes = await listQuizzes(req.user!.id)
    res.json(quizzes)
  } catch (err) {
    next(err)
  }
})

quizRoutes.post("/generate", validateBody(generateQuizSchema), async (req, res, next) => {
  try {
    const quiz = await generateQuiz(req.user!.id, req.body)
    res.status(201).json(quiz)
  } catch (err) {
    next(err)
  }
})