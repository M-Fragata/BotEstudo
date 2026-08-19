import { Router } from "express"
import { validateBody } from "../middleware/validate.ts"
import { authMiddleware } from "../middleware/auth.ts"
import { loginSchema, registerSchema } from "../schemas/auth.schema.ts"
import { login, register } from "../services/auth.service.ts"

export const authRoutes = Router()

authRoutes.post("/register", validateBody(registerSchema), async (req, res) => {
  const result = await register(req.body)
  res.status(201).json(result)
})

authRoutes.post("/login", validateBody(loginSchema), async (req, res) => {
  const result = await login(req.body)
  res.json(result)
})

authRoutes.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user })
})