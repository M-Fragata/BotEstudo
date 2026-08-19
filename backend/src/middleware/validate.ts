import type { NextFunction, Request, Response } from "express"
import type { ZodSchema } from "zod"

function primeiraMensagem(err: { issues: Array<{ message: string }> }): string {
  return err.issues[0]?.message ?? "Dados inválidos"
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const message = primeiraMensagem(result.error)
      console.warn(`[Validação] ${req.method} ${req.originalUrl}: ${message}`)
      res.status(400).json({ error: message, details: result.error.flatten() })
      return
    }
    req.body = result.data
    next()
  }
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params)
    if (!result.success) {
      const message = primeiraMensagem(result.error)
      console.warn(`[Validação] ${req.method} ${req.originalUrl}: ${message}`)
      res.status(400).json({ error: message, details: result.error.flatten() })
      return
    }
    req.params = result.data as unknown as Request["params"]
    next()
  }
}