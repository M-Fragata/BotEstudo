import z from "zod"

export const createMaterialSchema = z.object({
  disciplineId: z.string().min(1, "Disciplina obrigatória"),
  title: z.string().min(1, "Título obrigatório"),
  content: z.string().min(10, "O conteúdo deve ter pelo menos 10 caracteres").optional(),
  fileUrl: z.url("URL inválida").optional()
})

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>