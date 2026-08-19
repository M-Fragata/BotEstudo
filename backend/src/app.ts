import express from "express"
import cors from "cors"
import { Env } from "./utils/Environment.ts"
import { errorHandler } from "./middleware/error.ts"
import { AppError } from "./utils/errors.ts"
import { authRoutes } from "./routes/auth.routes.ts"
import { disciplineRoutes } from "./routes/disciplines.routes.ts"
import { materialRoutes } from "./routes/materials.routes.ts"
import { quizRoutes } from "./routes/quizzes.routes.ts"
import { sessionRoutes } from "./routes/sessions.routes.ts"
import { statsRoutes } from "./routes/stats.routes.ts"
import { questionRoutes } from "./routes/questions.routes.ts"

export const app = express()

app.use(
  cors({
    origin: Env.CLIENT_URL
  })
)
app.use(express.json({ limit: "10mb" }))

app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.use("/auth", authRoutes)
app.use("/disciplines", disciplineRoutes)
app.use("/materials", materialRoutes)
app.use("/quizzes", quizRoutes)
app.use("/sessions", sessionRoutes)
app.use("/stats", statsRoutes)
app.use("/questions", questionRoutes)

app.use((_req, _res, next) => {
  next(new AppError(404, "Rota não encontrada"))
})

app.use(errorHandler)