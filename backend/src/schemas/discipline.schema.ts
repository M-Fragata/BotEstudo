import z from "zod"

export const createDisciplineSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  icon: z.string().optional(),
  tone: z.enum(["primary", "secondary", "tertiary"]).optional()
})

export const updateDisciplineSchema = createDisciplineSchema.partial()

export const idParamsSchema = z.object({
  id: z.string().min(1)
})

export type CreateDisciplineInput = z.infer<typeof createDisciplineSchema>
export type UpdateDisciplineInput = z.infer<typeof updateDisciplineSchema>