import { Router } from "express"
import { validateBody } from "../middleware/validate.ts"
import { authMiddleware } from "../middleware/auth.ts"
import { createMaterialSchema } from "../schemas/material.schema.ts"
import { prisma } from "../utils/prisma.ts"
import { AppError } from "../utils/errors.ts"

export const materialRoutes = Router()

materialRoutes.use(authMiddleware)

materialRoutes.get("/", async (req, res, next) => {
  try {
    const materials = await prisma.studyMaterial.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        fileUrl: true,
        createdAt: true,
        disciplineId: true,
        discipline: { select: { name: true } }
      }
    })
    res.json(materials)
  } catch (err) {
    next(err)
  }
})

materialRoutes.post("/", validateBody(createMaterialSchema), async (req, res, next) => {
  try {
    const discipline = await prisma.discipline.findFirst({
      where: { id: req.body.disciplineId, userId: req.user!.id }
    })
    if (!discipline) {
      throw new AppError(404, "Disciplina não encontrada")
    }

    const material = await prisma.studyMaterial.create({
      data: {
        userId: req.user!.id,
        disciplineId: req.body.disciplineId,
        title: req.body.title,
        content: req.body.content ?? null,
        fileUrl: req.body.fileUrl ?? null
      },
      select: {
        id: true,
        title: true,
        content: true,
        fileUrl: true,
        createdAt: true
      }
    })
    res.status(201).json(material)
  } catch (err) {
    next(err)
  }
})