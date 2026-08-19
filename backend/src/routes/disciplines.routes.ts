import { Router } from "express"
import { validateBody, validateParams } from "../middleware/validate.ts"
import { authMiddleware } from "../middleware/auth.ts"
import {
  createDisciplineSchema,
  idParamsSchema,
  updateDisciplineSchema
} from "../schemas/discipline.schema.ts"
import { prisma } from "../utils/prisma.ts"
import { AppError } from "../utils/errors.ts"

export const disciplineRoutes = Router()

disciplineRoutes.use(authMiddleware)

disciplineRoutes.get("/", async (req, res, next) => {
  try {
    const disciplines = await prisma.discipline.findMany({
      where: { userId: req.user!.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        icon: true,
        tone: true,
        retention: true,
        createdAt: true
      }
    })
    res.json(disciplines)
  } catch (err) {
    next(err)
  }
})

disciplineRoutes.post("/", validateBody(createDisciplineSchema), async (req, res, next) => {
  try {
    const discipline = await prisma.discipline.create({
      data: {
        userId: req.user!.id,
        name: req.body.name,
        icon: req.body.icon ?? null,
        tone: req.body.tone ?? null
      }
    })
    res.status(201).json(discipline)
  } catch (err) {
    next(err)
  }
})

disciplineRoutes.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateDisciplineSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params as { id: string }
      const existing = await prisma.discipline.findFirst({
        where: { id, userId: req.user!.id }
      })
      if (!existing) {
        throw new AppError(404, "Disciplina não encontrada")
      }

      const data: { name?: string; icon?: string | null; tone?: string | null } = {}
      if (req.body.name !== undefined) data.name = req.body.name
      if (req.body.icon !== undefined) data.icon = req.body.icon
      if (req.body.tone !== undefined) data.tone = req.body.tone

      const discipline = await prisma.discipline.update({
        where: { id },
        data
      })
      res.json(discipline)
    } catch (err) {
      next(err)
    }
  }
)

disciplineRoutes.delete(
  "/:id",
  validateParams(idParamsSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params as { id: string }
      const existing = await prisma.discipline.findFirst({
        where: { id, userId: req.user!.id }
      })
      if (!existing) {
        throw new AppError(404, "Disciplina não encontrada")
      }

      await prisma.discipline.delete({ where: { id } })
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
)