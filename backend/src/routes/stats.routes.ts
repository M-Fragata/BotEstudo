import { Router } from "express"
import { authMiddleware } from "../middleware/auth.ts"
import { prisma } from "../utils/prisma.ts"

export const statsRoutes = Router()

statsRoutes.use(authMiddleware)

statsRoutes.get("/", async (req, res, next) => {
  try {
    const userId = req.user!.id
    const weekStart = startOfWeek()

    const [stats, disciplines, answeredSessions] = await Promise.all([
      prisma.userStat.findUnique({
        where: { userId_weekStart: { userId, weekStart } }
      }),
      prisma.discipline.findMany({
        where: { userId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, icon: true, tone: true, retention: true }
      }),
      prisma.quizSession.count({ where: { userId, finishedAt: { not: null } } })
    ])

    const done = stats?.questionsDone ?? 0
    const right = stats?.questionsRight ?? 0
    const weeklyProgress = done > 0 ? Math.round((right / done) * 100) : 0

    const statsPayload = {
      weeklyProgress,
      questionsAnswered: done,
      studyTime: formatStudyTime(answeredSessions * 25) // 25min médios por simulado até termos telemetria real
    }

    res.json({ stats: statsPayload, disciplines })
  } catch (err) {
    next(err)
  }
})

function startOfWeek(): Date {
  const now = new Date()
  const day = (now.getDay() + 6) % 7
  const start = new Date(now)
  start.setDate(now.getDate() - day)
  start.setHours(0, 0, 0, 0)
  return start
}

function formatStudyTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}